import { Download, RefreshCw } from 'lucide-react';
import CardShell from './CardShell';
import CardAction from './CardAction';
import PreparedCardDialog from './PreparedCardDialog';
import { usePreparedCard } from '../hooks/usePreparedCard';

/**
 * One card: the artwork, its title, and the one thing worth doing with it.
 *
 * THE PREVIEW IS NOT A LINK. It briefly carried a hover "View" that opened the
 * raw artwork, and having two targets on one card made the cheap one look like
 * the point — the file an agent actually sends is the *branded* one, and that
 * is what the button below builds and shows. A second route to the unbranded
 * original is at best redundant and at worst the thing they send by mistake.
 * The hover badge and the link went together on purpose: a clickable image with
 * nothing to say so is worse than one that is plainly just an image.
 *
 * `linkUrl` is therefore deliberately not wired up. It is null on every banner
 * the service currently holds; the field stays documented in the API layer
 * because the payload has it, not because this screen is waiting for it.
 *
 * `agent` comes down from the grid rather than being read here, so one profile
 * fetch serves the whole category — see `useAgentFooter`. No `agent` means no
 * button: the agent is still onboarding or has no POSP code yet, and a footer
 * with a blank identity line is worse than none.
 */
const LABEL = {
  preparing: 'Preparing…',
  failed: 'Try again',
};

function BannerCard({ banner, agent }) {
  const { title, imageUrl } = banner;
  const { status, error, ready, prepare, dismiss } = usePreparedCard({ imageUrl, agent });

  const failed = status === 'failed';

  return (
    <>
      <CardShell
        title={title}
        imageUrl={imageUrl}
        actions={
          agent &&
          imageUrl && (
            <CardAction
              busy={status === 'preparing'}
              icon={failed ? <RefreshCw /> : <Download />}
              label={LABEL[status] ?? 'Download & Share'}
              onClick={prepare}
            >
              {/* The server's own sentence rather than a generic failure: the
                  realistic cause is the uploads host refusing to be read from
                  this origin, which no retry fixes and which the agent needs to
                  be able to report accurately. */}
              {failed && (
                <p role="alert" className="font-body-md text-body-md text-error">
                  {error?.message || "Couldn't prepare this card."}
                </p>
              )}
            </CardAction>
          )
        }
      />

      <PreparedCardDialog open={status === 'ready'} card={ready} title={title} onClose={dismiss} />
    </>
  );
}

export default BannerCard;
