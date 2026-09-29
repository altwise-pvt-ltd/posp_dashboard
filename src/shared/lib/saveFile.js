/**
 * Getting a file onto the agent's device.
 *
 * ⚠ THE `download` ATTRIBUTE IS IGNORED CROSS-ORIGIN. An `<a download>` whose
 * href points at another origin does not save anything — the browser navigates
 * to it instead, and the agent ends up looking at a PDF in a tab wondering
 * where their download went. The attribute is only honoured for same-origin
 * URLs, which a `blob:` is and `notification.shrisoft.co.in` is not.
 *
 * So anything that must genuinely *save* has to come through `fetch` first and
 * be handed to the anchor as a blob. That is the only reason `fetchAndSave`
 * exists, and the reason it needs the same CORS header the canvas path does.
 */

/** A blob the app already holds → the agent's downloads folder. */
export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = name;

  /* Firefox will not act on a click from a node that is not in the document. */
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  /* Revoking in the same tick cancels the download in Safari; the next one is
     late enough for the fetch the click started to have taken its reference. */
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * A remote file → the agent's downloads folder.
 *
 * `cors` explicitly rather than by default: a `no-cors` request resolves with
 * an opaque body of zero length, which would save a 0-byte PDF and report
 * success. A failure the agent can see beats a file they cannot open.
 *
 * `cache: 'reload'` for the same reason `loadArtwork` uses it — `/uploads/**`
 * omits `Vary: Origin` on requests that carry no `Origin`, so opening the PDF
 * in a tab first caches a header-less copy that a later CORS fetch is handed
 * and must reject. Without this, downloading a brochure would start failing the
 * moment the agent previewed it. See the note in `lib/brandFooter.js`.
 */
export async function fetchAndSave(url, name) {
  const response = await fetch(url, { mode: 'cors', cache: 'reload', credentials: 'omit' });

  if (!response.ok) {
    throw new Error(`The file could not be downloaded (${response.status}).`);
  }

  saveBlob(await response.blob(), name);
}
