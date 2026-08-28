/**
 * Pixel dimensions of a picked image.
 *
 * The only image *decoding* left in the upload path. It exists for the
 * thumbnail check — an image too small to read is the one quality problem a
 * user can fix and the server can't — and it decodes without re-encoding, so
 * the file that gets uploaded is untouched by it.
 */

/** Read an image's natural width and height. Throws if it will not decode. */
export async function readDimensions(file) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close?.();
    return { width, height };
  }

  // Older Safari can't take a Blob here; the <img> path works everywhere.
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("UNDECODABLE"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
