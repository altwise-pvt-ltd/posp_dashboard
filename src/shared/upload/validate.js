/**
 * The one place a file is judged.
 *
 * Each check stands on its own: the magic number decides the format, the pixel
 * dimensions decide whether it is readable, the byte count decides whether it
 * needs shrinking. Two transforms exist, and both are conditional — HEIC is
 * transcoded to JPEG because no browser outside Safari can display it and no
 * OCR vendor will take it, and a file over the ceiling is compressed to fit.
 *
 * Anything already under the ceiling reaches the server untouched, at its
 * original resolution and quality. That is the point of doing it here rather
 * than on every pick: a document's fine print is what OCR reads, so the lossy
 * pass is a cost paid only by the uploads that actually need it.
 *
 * Two entry points, because they answer questions at different moments:
 *
 *   prepareFile()       async, at selection. Sniffs the format, transcodes HEIC
 *                       if needed, checks the image is big enough to read, and
 *                       compresses it if it is too large. Returns the file the
 *                       form should hold — the very same File that came in,
 *                       unless it was a HEIC or over the ceiling.
 *
 *   checkPreparedFile() sync, at submit. The zod refinement. Cheap enough to
 *                       run on every validation pass, and a backstop for
 *                       anything that reached form state without going through
 *                       prepareFile.
 */

import { maxMegabytes, formatList, outputMimes } from "./policy";
import { sniffFormat } from "./signature";
import { convertHeicToJpeg } from "./heic";
import { readDimensions } from "./dimensions";
import { compressImage } from "./compress";

/**
 * Past this, a pick isn't a document, it's a mistake — and handing it to a
 * canvas would sooner crash the tab on a low-end phone than compress anything.
 * Nothing a phone camera produces comes close.
 */
const ABSURD_BYTES = 40 * 1024 * 1024;

/**
 * Failure codes, so callers can react to a specific case without matching on
 * message text. `HEIC_FAILED` and `TOO_LARGE` are the ones worth special-casing:
 * they are the failures where the user did nothing wrong.
 */
export const UPLOAD_ERROR = {
  MISSING: "MISSING",
  EMPTY: "EMPTY",
  TOO_LARGE: "TOO_LARGE",
  TOO_SMALL: "TOO_SMALL",
  WRONG_TYPE: "WRONG_TYPE",
  HEIC_FAILED: "HEIC_FAILED",
};

const fail = (code, message) => ({ ok: false, code, message });

/**
 * Only ever seen when compression couldn't rescue the file — an absurd pick, an
 * image that wouldn't decode, or one that stayed over the ceiling anyway. The
 * advice has to be something the user can act on with the photo they have.
 */
function tooLargeMessage(profile) {
  return `We couldn't get that image under ${maxMegabytes(profile)} MB. Please upload a photo taken at a lower resolution.`;
}

/**
 * What to say about something that isn't a usable image.
 *
 * PDF is called out by name because it is the most likely wrong pick in this
 * flow and the least obvious to resolve — an agent holding a DigiLocker
 * download needs to be told to photograph it, and "invalid file" sends them to
 * support instead.
 */
function wrongTypeMessage(profile, format) {
  const accepted = formatList(profile);
  if (format === "pdf") {
    return `PDFs aren't accepted — please upload a photo or screenshot of the document instead (${accepted}).`;
  }
  return `That doesn't look like a photo. Please upload a ${accepted} file.`;
}

/** True when the profile takes HEIC as an input format. */
function acceptsHeic(profile) {
  return profile.inputOnly.some((format) => format.key === "heic");
}

/** The output-format entry matching a sniffed format, or undefined. */
function outputFormatFor(profile, format) {
  return profile.output.find((entry) => entry.key === format);
}

/**
 * Re-label a file whose MIME doesn't match its bytes.
 *
 * Browsers derive `file.type` from the extension, so a genuine JPEG saved as
 * `scan` with no extension arrives with an empty type — and an empty type fails
 * the submit-time check and gets sent to the server as
 * `application/octet-stream`. Rewrapping a File is a handle change, not a copy:
 * the blob is shared, nothing is read, and the pixels are identical.
 */
function retype(file, mime) {
  if (file.type === mime) return file;
  return new File([file], file.name, { type: mime, lastModified: file.lastModified });
}

/**
 * Run a freshly selected file through the full pipeline.
 *
 * Resolves to `{ ok: true, file }` with the File the form should hold, or
 * `{ ok: false, code, message }`.
 */
export async function prepareFile(input, profile) {
  if (!(input instanceof File)) {
    return fail(UPLOAD_ERROR.MISSING, "Please choose a file.");
  }

  if (input.size === 0) {
    return fail(UPLOAD_ERROR.EMPTY, "That file is empty. Please choose another one.");
  }

  // Checked before the bytes are touched, so an absurd pick costs nothing.
  if (input.size > ABSURD_BYTES) {
    return fail(UPLOAD_ERROR.TOO_LARGE, tooLargeMessage(profile));
  }

  const format = await sniffFormat(input);

  if (format === "pdf") {
    return fail(UPLOAD_ERROR.WRONG_TYPE, wrongTypeMessage(profile, "pdf"));
  }

  let file;

  if (format === "heic") {
    if (!acceptsHeic(profile)) {
      return fail(UPLOAD_ERROR.WRONG_TYPE, wrongTypeMessage(profile));
    }
    try {
      file = await convertHeicToJpeg(input);
    } catch {
      return fail(
        UPLOAD_ERROR.HEIC_FAILED,
        "We couldn't read that iPhone photo. Please try again, or re-save it as a JPG and upload that."
      );
    }
  } else {
    const output = outputFormatFor(profile, format);
    // Anything the sniffer couldn't name, or named as a format this profile
    // doesn't store. Nothing converts it now, so this is where it stops.
    if (!output) {
      return fail(UPLOAD_ERROR.WRONG_TYPE, wrongTypeMessage(profile, format));
    }
    file = retype(input, output.mime);
  }

  /**
   * The thumbnail check — the one quality problem the user can fix and the
   * server can't. A file that won't decode is let through rather than refused:
   * the signature already vouched for the format, so a failure here is a
   * low-memory device struggling with a large image far more often than it is a
   * bad file, and blocking a good upload on a measurement is the worse trade.
   */
  const { width, height } = await readDimensions(file).catch(() => ({
    width: Infinity,
    height: Infinity,
  }));

  if (Math.min(width, height) < profile.minDimension) {
    return fail(
      UPLOAD_ERROR.TOO_SMALL,
      "That image is too small to read. Please upload a clearer, full-size photo."
    );
  }

  /**
   * Last, so it only ever runs on a file that has already earned its place —
   * and only when the file is actually too big. Measured after the dimension
   * check on purpose: the floor should judge the photo the agent took, not the
   * one we resized.
   */
  if (file.size > profile.maxBytes) {
    try {
      file = await compressImage(file, profile.maxBytes);
    } catch {
      return fail(UPLOAD_ERROR.TOO_LARGE, tooLargeMessage(profile));
    }
    // The compressor targets the ceiling but can't promise it on a pathological
    // image, and the server is the one that would reject it.
    if (file.size > profile.maxBytes) {
      return fail(UPLOAD_ERROR.TOO_LARGE, tooLargeMessage(profile));
    }
  }

  return { ok: true, file };
}

/**
 * The submit-time gate over whatever is sitting in form state.
 *
 * Sync and byte-free by design: it runs on every zod pass, and re-reading a
 * file on each keystroke-triggered validation would be wasteful. Everything
 * prepareFile returns passes this trivially — its job is the paths that skipped
 * it, like a camera capture handed straight to `onNext` or a value written by
 * `setValue`. There is no size floor here because the real check is on pixel
 * dimensions, which cannot be read synchronously; prepareFile owns that.
 */
export function checkPreparedFile(value, profile) {
  if (!(value instanceof File)) {
    return fail(UPLOAD_ERROR.MISSING, "Please choose a file.");
  }
  if (value.size === 0) {
    return fail(UPLOAD_ERROR.EMPTY, "That file is empty. Please choose another one.");
  }
  if (!outputMimes(profile).includes(value.type)) {
    return fail(UPLOAD_ERROR.WRONG_TYPE, `Please upload a ${formatList(profile)} file.`);
  }
  if (value.size > profile.maxBytes) {
    return fail(UPLOAD_ERROR.TOO_LARGE, tooLargeMessage(profile));
  }
  return { ok: true, file: value };
}
