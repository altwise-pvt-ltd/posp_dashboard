import { Check, Download, Loader2, X } from 'lucide-react';
import { CAN_SHARE_FILES, IS_MOBILE, useShare } from '../hooks/useShare';
import WhatsAppIcon from './WhatsAppIcon';

const TONE = {
  filled: 'bg-primary text-white hover:bg-primary/90',
  accent: 'text-primary',
  quiet: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
};

const BUTTON = [
  /* Taller on a phone, where these are thumb targets rather than mouse ones,
     and back to a compact row from `sm` up. `min-w-0` + `truncate` keep a label
     inside a two-across tile instead of widening it. */
  'font-body-md text-body-md inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-2.5 transition sm:py-1.5',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
  'disabled:cursor-not-allowed disabled:opacity-40',
].join(' ');

/**
 * What a button says while something is happening to it.
 *
 * A real table, at module scope: the word, the icon and the colour of a state
 * sit on one line, so they cannot drift apart the way they do when the label is
 * decided in one conditional chain and the colour in a second one thirty lines
 * below. Anything not listed here is at rest.
 */
const STATUS_FACE = {
  preparing: { label: 'Preparing…', Icon: Loader2, spin: true },
  /* Built and waiting on a fresh gesture — see `armed` in `useShare`. "Send"
     rather than "WhatsApp" because the work is done and only the sending is
     left, and it is the one state that must read as an instruction: the agent
     has to tap again or nothing happens. Hence the only filled tone. */
  armed: { label: 'Send card', Icon: WhatsAppIcon, tone: 'filled' },
  saved: { label: 'Saved', Icon: Check, tone: 'accent' },
};

/* The one state whose wording depends on which button it lands on. A download
   that fails did not fail to *share*, and telling an agent it did sends them
   looking for a message that was never attempted — so each button names its own
   verb rather than borrowing the share button's. */
const FAILED_LABEL = {
  whatsapp: "Couldn't share",
  download: "Couldn't save",
};

/**
 * One action, drawn.
 *
 * `face` is only consulted when the hook's status belongs to *this* button —
 * two buttons share one hook, and a spinner on both while one is working would
 * say the wrong thing about the idle one.
 */
function Action({ idle, face, onClick, disabled }) {
  const { label, Icon, spin, tone = 'quiet' } = face ?? idle;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-busy={face?.spin || undefined}
      onClick={onClick}
      className={`${BUTTON} ${TONE[tone]}`}
    >
      <Icon aria-hidden="true" className={`size-4 shrink-0 ${spin ? 'animate-spin' : ''}`} />
      <span className="truncate">{label}</span>
    </button>
  );
}

/**
 * What a card offers: send it on WhatsApp, save it, or both.
 *
 * WhatsApp is the only sharing medium by decision, so there is no generic share
 * sheet button and no copy-link — but which of the two actions can be honoured
 * depends on the device, and a button that cannot deliver what it promises is
 * worse than one that is absent:
 *
 *   phone, banner         → [ WhatsApp ] [ Download ]   sheet takes the JPEG
 *   phone, brochure       → [ WhatsApp ] [ Download ]   sheet takes the PDF
 *   desktop, either       → [ Download ]                one button, by decision:
 *                                                       save it, then attach it
 *                                                       by hand
 *   phone, no file at all → [ WhatsApp ]                wa.me with caption and
 *                                                       link, the last resort
 *
 * Lives outside the card's anchor, not inside it. A button nested in a link is
 * invalid HTML and activates both on click.
 */
function CardActions({ title, url, text, prepareFile }) {
  const { share, download, action, status } = useShare();

  /* Not "is it branded" — a brochure's PDF is a file with no branding in it.
     What both buttons actually turn on is whether there is a file to produce. */
  const hasFile = Boolean(prepareFile);
  const busy = status === 'preparing';

  /* Undefined for every button but the one acting, so a spinner never appears
     on two at once. Failure is the one state that reads differently per button;
     the rest of the table is shared. */
  const faceFor = (own) => {
    if (action !== own) return undefined;
    if (status === 'failed') return { label: FAILED_LABEL[own], Icon: X };
    return STATUS_FACE[status];
  };

  /* Desktop shows one button, and it is Download — the agent saves the card and
     attaches it in whatever WhatsApp they have open. Windows Chrome *can* share
     a file, but only into the Windows share sheet, which does not reach a
     browser tab; offering it there sent agents into a list of Store apps. */
  const showWhatsApp = IS_MOBILE && (hasFile ? CAN_SHARE_FILES : Boolean(url || text));

  return (
    <>
      {showWhatsApp && (
        <Action
          idle={{ label: 'WhatsApp', Icon: WhatsAppIcon }}
          face={faceFor('whatsapp')}
          onClick={() => share({ title, url, text, prepareFile })}
          /* Drawing a 3 MB image takes a beat on a mid-range phone. Without
             this a second tap starts a second download and opens a second share
             sheet on top of the first. */
          disabled={busy}
        />
      )}

      {hasFile && (
        <Action
          idle={{ label: 'Download', Icon: Download }}
          face={faceFor('download')}
          onClick={() => download({ prepareFile })}
          disabled={busy}
        />
      )}
    </>
  );
}

export default CardActions;
