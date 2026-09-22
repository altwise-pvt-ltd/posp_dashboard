import { Check, Copy, Download, Loader2, Share2, X } from 'lucide-react';
import { CAN_SHARE, CAN_SHARE_FILES, useShare } from '../hooks/useShare';

const TONE = {
  filled: 'bg-primary text-white hover:bg-primary/90',
  accent: 'text-primary',
  quiet: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
};

/**
 * What the button says while something is happening to it.
 *
 * A real table, at module scope: the word, the icon and the colour of a state
 * sit on one line, so they cannot drift apart the way they do when the label is
 * decided in one conditional chain and the colour in a second one thirty lines
 * below. Anything not listed here is at rest — see `idleFace`.
 */
const STATUS_FACE = {
  preparing: { label: 'Preparing…', Icon: Loader2, spin: true },
  /* Built and waiting on a fresh gesture — see `armed` in `useShare`. "Send"
     rather than "Share" because the work is done and only the sending is left,
     and it is the one state that must read as an instruction: the agent has to
     tap again or nothing happens. Hence the only filled tone. */
  armed: { label: 'Send card', Icon: Share2, tone: 'filled' },
  copied: { label: 'Link copied', Icon: Check, tone: 'accent' },
  saved: { label: 'Card saved', Icon: Check, tone: 'accent' },
  failed: { label: "Couldn't share", Icon: X },
};

/**
 * What it says at rest — which is a question about the device, not the state.
 *
 * The four answers line up with the rungs in `useShare`, so the button never
 * promises a sheet it cannot open, and the branded rungs say "card" rather than
 * "link" because what leaves the device is the artwork with the agent's details
 * on it.
 */
function idleFace(branded) {
  if (branded) {
    return CAN_SHARE_FILES
      ? { label: 'Share card', Icon: Share2 }
      : { label: 'Download card', Icon: Download };
  }
  return CAN_SHARE ? { label: 'Share', Icon: Share2 } : { label: 'Copy link', Icon: Copy };
}

/**
 * The one action a card offers today.
 *
 * Lives outside the card's anchor, not inside it. A button nested in a link is
 * invalid HTML and behaves unpredictably — the click activates both.
 */
function ShareButton({ title, url, text, prepareFile }) {
  const { share, status } = useShare();

  const branded = Boolean(prepareFile);
  const { label, Icon, spin, tone = 'quiet' } = STATUS_FACE[status] ?? idleFace(branded);

  /* Drawing a 3 MB image takes a beat on a mid-range phone. Without this a
   * second tap starts a second download and opens a second share sheet on top
   * of the first. */
  const busy = status === 'preparing';

  return (
    <button
      type="button"
      disabled={(!url && !branded) || busy}
      aria-busy={busy || undefined}
      onClick={() => share({ title, url, text, prepareFile })}
      className={[
        /* Taller on a phone, where this is a thumb target rather than a mouse
           one, and back to a compact row from `sm` up. `min-w-0` + `truncate`
           keep the label inside a two-across tile instead of widening it. */
        'font-body-md text-body-md inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-2.5 transition sm:py-1.5',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'disabled:cursor-not-allowed disabled:opacity-40',
        TONE[tone],
      ].join(' ')}
    >
      <Icon aria-hidden="true" className={`size-4 shrink-0 ${spin ? 'animate-spin' : ''}`} />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default ShareButton;
