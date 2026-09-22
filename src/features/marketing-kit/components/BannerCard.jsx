import { useCallback } from 'react';
import CardShell from './CardShell';
import { shareCaption, signatureLines } from '../lib/agentSignature';
import { buildBrandedCard } from '../lib/brandedCard';

/**
 * One banner: the artwork, its title, and what you can do with it.
 *
 * `linkUrl` is null on every banner the service currently holds, so opening
 * falls through to the image itself. That is the more useful target anyway —
 * an agent wants to see the card full size before sending it.
 *
 * Sharing sends the artwork as a file with the agent's signature drawn along
 * its bottom edge — see `lib/brandedCard`. With no `agent` — an onboarding
 * user, or a profile that has not answered yet — `prepareFile` is undefined and
 * the share falls back to the plain link. Nothing on screen breaks; the button
 * just says "Share" again.
 */
function BannerCard({ banner, agent }) {
  const { title, imageUrl, linkUrl } = banner;

  /* `useCallback` and not a bare arrow: `ShareButton` takes this as a prop, and
   * a new function identity on every render of a 20-card grid would defeat any
   * memoisation added to the button later. */
  const prepareFile = useCallback(
    () =>
      buildBrandedCard({
        imageUrl,
        title,
        lines: signatureLines(agent),
        photoUrl: agent?.photo,
      }),
    [imageUrl, title, agent]
  );

  return (
    <CardShell
      title={title}
      imageUrl={imageUrl}
      href={linkUrl || imageUrl}
      shareUrl={imageUrl || linkUrl}
      shareText={shareCaption(title, agent)}
      prepareFile={imageUrl && agent ? prepareFile : undefined}
      openLabel="View"
    />
  );
}

export default BannerCard;
