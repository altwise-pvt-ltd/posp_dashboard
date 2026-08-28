/**
 * Shrink an oversized image to fit the ceiling.
 *
 * Only runs when a file is actually over the limit. Anything already under it
 * is left completely untouched — the original bytes, at the original
 * resolution, are what reach the server, which is what OCR wants.
 *
 * The lever is resolution, not quality. A 2000px long edge is more than enough
 * to read an Aadhaar number, and it is where nearly all of the bytes go on a
 * modern phone capture; dropping quality is the fallback, because JPEG
 * artefacts cluster exactly on the fine print OCR has to read. `maxSizeMB` is
 * a guarantee rather than a target — after the resize it is rarely reached.
 *
 * Behind a dynamic import, like the HEIC decoder, so agents who never pick an
 * oversized file never download it.
 */

let libPromise = null;

function loadCompressor() {
  if (!libPromise) {
    libPromise = import("browser-image-compression").catch((cause) => {
      // Don't cache a failed chunk request for the life of the page.
      libPromise = null;
      throw cause;
    });
  }
  return libPromise;
}

/**
 * Compress `file` to fit `maxBytes`. Resolves to a new File; throws if the
 * image will not decode.
 */
export async function compressImage(file, maxBytes) {
  const { default: imageCompression } = await loadCompressor();

  const blob = await imageCompression(file, {
    maxSizeMB: maxBytes / (1024 * 1024),
    maxWidthOrHeight: 2000,
    initialQuality: 0.85,
    // Keeps the encode off the main thread — a 20 MP capture would otherwise
    // freeze the drop zone mid-spinner on a mid-range phone.
    useWebWorker: true,
    fileType: "image/jpeg",
  });

  return new File([blob], toJpegName(file.name), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

/** A PNG that gets re-encoded is a JPEG now; its name should say so. */
function toJpegName(name) {
  if (!name) return "photo.jpg";
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}
