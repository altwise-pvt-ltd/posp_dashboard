/**
 * The one sharing medium this module targets.
 *
 * WHY A LINK AND NOT AN ATTACHMENT — `wa.me/?text=` is the only WhatsApp entry
 * point the web can reach, and it carries *text only*. There is no parameter
 * that attaches a file; WhatsApp does not offer one. So this is never how a
 * card travels by design — that goes through the share sheet as a real `File`
 * (see `useShare`), which is also the only way the agent's details survive.
 *
 * It is the last resort, and nothing routes here on purpose any more: a banner
 * builds a branded JPEG, a banner with no profile builds an unsigned one, and a
 * brochure attaches its PDF. This runs only when every one of those has failed
 * — the uploads host unreachable, or a browser refusing the file's type — where
 * the choice is a link or nothing at all.
 *
 * No phone number in the path. `wa.me/` with none opens WhatsApp's own contact
 * picker, which is what an agent wants — they are choosing a customer, and we
 * have no number to pre-fill anyway.
 */

const ENDPOINT = 'https://wa.me/';

/**
 * Caption and link, one message.
 *
 * A blank line between them rather than a space: WhatsApp auto-links the URL
 * and renders a preview card beneath the text, and a URL run onto the end of
 * the signature's last line reads as part of the helpline number.
 */
function whatsAppShareUrl({ text, url }) {
  const body = [text, url].filter(Boolean).join('\n\n').trim();
  if (!body) return null;

  return `${ENDPOINT}?text=${encodeURIComponent(body)}`;
}

/**
 * Open it, and say whether that worked.
 *
 * Returns false when there is nothing to send or the window was blocked, so
 * the caller can show a failure rather than assume a tab appeared. A popup
 * blocker is the realistic cause: this must be called straight out of the
 * click, before anything is awaited, or the tap's activation has lapsed.
 *
 * The `noopener` *feature string* is deliberately not used, even though the new
 * tab must not keep a handle on this one: `window.open` with it returns null by
 * specification, success or not, which would make the check above read every
 * share as blocked. Clearing `opener` on the handle does the same job and still
 * leaves something to test.
 */
export function openWhatsApp({ text, url }) {
  const href = whatsAppShareUrl({ text, url });
  if (!href) return false;

  const opened = window.open(href, '_blank');
  if (!opened) return false;

  try {
    opened.opener = null;
  } catch {
    /* Cross-origin by the time this runs on some browsers. The tab is open,
     * which is the part the caller asked about. */
  }

  return true;
}
