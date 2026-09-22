/**
 * A remote artefact, fetched into a `File` the share sheet will take.
 *
 * WHY — the module's rule is that what reaches the customer is the artefact
 * itself, not a URL pointing at it. `brandedCard` already honours that for a
 * banner it can draw. This covers the two cases it cannot:
 *
 *   - a brochure, which is a PDF; a canvas cannot draw one, but WhatsApp
 *     accepts a PDF attachment perfectly well, and an unstamped document is
 *     still the document. (Stamping the agent's details *into* the PDF needs a
 *     PDF library and remains unbuilt.)
 *   - artwork whose canvas step failed — a `toBlob` a browser would not do, a
 *     portrait that poisoned the draw. The bytes are still fetchable, and an
 *     unbranded card beats a link.
 *
 * Needs the same CORS header the canvas path needs, and the uploads host sends
 * it. A throw here means the caller has genuinely nothing to attach.
 */

import { fileNameFor } from './fileName';

/** Extensions for what the uploads host actually serves. */
const EXTENSIONS = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * The served type first — it is what the recipient's app will honour. The URL's
 * own extension is the fallback for a host answering with a generic
 * `application/octet-stream`.
 */
function extensionFor(type, url) {
  const fromUrl = url.split('?')[0].split('.').pop();
  return EXTENSIONS[type] || (fromUrl && fromUrl.length <= 4 ? fromUrl : 'bin');
}

export async function fetchAsFile(url, title) {
  if (!url) throw new Error('No file to share.');

  /* `cors` explicitly rather than by default: a `no-cors` request would resolve
   * with an opaque body of zero length, and an empty attachment is far worse
   * than a failure that falls through to something else. */
  const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!response.ok) throw new Error(`The file could not be fetched (${response.status}).`);

  const blob = await response.blob();
  if (!blob.size) throw new Error('The file came back empty.');

  return new File([blob], fileNameFor(title, extensionFor(blob.type, url), 'marketing-file'), {
    type: blob.type || 'application/octet-stream',
    lastModified: Date.now(),
  });
}
