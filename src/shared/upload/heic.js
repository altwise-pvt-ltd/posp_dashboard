/**
 * HEIC → JPEG, loaded only when a HEIC actually turns up.
 *
 * HEIC is accepted because it is the iPhone camera default and telling agents
 * to go and change their camera settings is not a flow anyone completes. It is
 * converted immediately rather than stored, because a HEIC that reaches form
 * state breaks three things at once: the preview `<img>` renders nothing on
 * every browser except Safari, canvas cannot decode it so no later image work
 * is possible, and OCR vendors reject the format outright. Converting at the
 * door means the rest of the application only ever handles JPEG and PNG, and
 * the backend needs no HEIF support to receive iPhone uploads.
 *
 * The decoder is a WASM bundle of real size, so it is behind a dynamic import
 * and reached only after signature.js has confirmed the bytes are HEIF-family.
 * Agents on Android and desktop never download it.
 */

import { HEIC_JPEG_QUALITY } from "./policy";

/**
 * Cached so a form with two HEIC uploads pays the download once.
 *
 * The promise is cached rather than the module, so two conversions started in
 * the same tick share one in-flight request instead of racing two.
 */
let decoderPromise = null;

function loadDecoder() {
  if (!decoderPromise) {
    decoderPromise = import("heic-to").catch((cause) => {
      // Let the next attempt retry rather than caching a failure for the life
      // of the page — this is usually a flaky network on a chunk request, and
      // an agent who retries the upload deserves a working second try.
      decoderPromise = null;
      throw cause;
    });
  }
  return decoderPromise;
}

/** Swap a .heic/.heif tail for .jpg, keeping whatever the user named the file. */
function toJpegName(name) {
  if (!name) return "photo.jpg";
  return name.replace(/\.(heic|heif)$/i, "") + ".jpg";
}

/**
 * Transcode a HEIC/HEIF file to a JPEG File.
 *
 * Throws if the decoder cannot be fetched or the bytes will not decode; the
 * caller turns that into a message, since what to say depends on whether this
 * was a document or a selfie.
 */
export async function convertHeicToJpeg(file) {
  const { heicTo } = await loadDecoder();

  const blob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: HEIC_JPEG_QUALITY,
  });

  return new File([blob], toJpegName(file.name), {
    type: "image/jpeg",
    // Preserved so the converted file still sorts and reads as the photo the
    // agent took, not as something created the moment they hit upload.
    lastModified: file.lastModified,
  });
}
