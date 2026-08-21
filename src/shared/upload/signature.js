/**
 * Format sniffing — the only thing that decides what a file actually is.
 *
 * This used to answer just two questions, because compression settled the rest:
 * anything the browser couldn't draw to a canvas threw, and anything it could
 * was re-encoded to JPEG rather than refused. Nothing is re-encoded any more —
 * the bytes the user picked are the bytes that get uploaded — so the magic
 * number is now the whole gate, and it has to name the storable formats too.
 *
 *   jpeg / png — what may be uploaded. Sniffed rather than read off
 *                `file.type`, because that string is derived from the filename
 *                on most platforms and is empty often enough (Android share
 *                sheets, some sync clients) that trusting it rejects real
 *                photos.
 *
 *   heic       — canvas cannot decode it outside Safari and OCR vendors refuse
 *                it, so it is transcoded to JPEG at the door. Sniffing is also
 *                how agents on Android and desktop avoid downloading a WASM
 *                decoder they have no use for; 32 bytes buys that.
 *
 *   pdf        — would otherwise surface as a generic "that isn't a photo".
 *                Naming it is worth the four extra bytes: an agent holding a
 *                DigiLocker download needs to be told to photograph it, and
 *                that's the single most common wrong pick in this flow.
 *
 * Note this is not a security boundary and never was. It runs in the browser,
 * so anything deliberate walks straight past it. The server validates; this is
 * here to give a confused user an accurate sentence.
 */

const SIGNATURE_BYTES = 32;

/**
 * ISO base media brands that mean "HEIF-family still image".
 *
 * `mif1` and `msf1` are the generic HEIF brands rather than HEIC proper; they
 * turn up on some Android and Samsung captures and decode the same way, so
 * there is nothing to gain by being stricter than the decoder is.
 */
const HEIF_BRANDS = new Set([
  "heic", "heix", "heim", "heis",
  "hevc", "hevx", "hevm", "hevs",
  "mif1", "msf1",
]);

/** Read the leading bytes without pulling the whole file into memory. */
async function readSignature(file) {
  const slice = file.slice(0, SIGNATURE_BYTES);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Compare a run of bytes against ASCII text at a fixed offset. */
function asciiAt(bytes, offset, text) {
  if (bytes.length < offset + text.length) return false;
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

/** Compare a run of bytes against fixed byte values at the head of the file. */
function bytesAt(bytes, offset, expected) {
  if (bytes.length < offset + expected.length) return false;
  return expected.every((value, i) => bytes[offset + i] === value);
}

/**
 * Identify the file's format.
 *
 * Returns "jpeg", "png", "heic", "pdf", or null. null means "not something we
 * take" — a WebP, a BMP, a renamed ZIP; the caller turns that into a message.
 */
export async function sniffFormat(file) {
  let bytes;
  try {
    bytes = await readSignature(file);
  } catch {
    // Unreadable — removed from disk after selection, or a permissions failure
    // on a synced folder. Nothing downstream will manage it either.
    return null;
  }

  if (bytes.length === 0) return null;

  // JPEG — SOI marker, then the first segment's own marker byte.
  if (bytesAt(bytes, 0, [0xff, 0xd8, 0xff])) return "jpeg";

  // PNG — the 8-byte signature, including the CRLF/EOF trap bytes.
  if (bytesAt(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";

  // HEIC/HEIF — ISO base media: [4-byte box size]["ftyp"][4-byte major brand].
  if (asciiAt(bytes, 4, "ftyp")) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (HEIF_BRANDS.has(brand)) return "heic";
  }

  if (asciiAt(bytes, 0, "%PDF-")) return "pdf";

  return null;
}
