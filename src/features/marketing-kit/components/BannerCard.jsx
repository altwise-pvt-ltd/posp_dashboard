import { useCallback } from 'react';
import CardShell from './CardShell';
import { shareCaption, signatureLines } from '../lib/agentSignature';
import { buildBrandedCard } from '../lib/brandedCard';
import { fetchAsFile } from '../lib/remoteFile';

/**
 * One banner: the artwork, its title, and what you can do with it.
 *
 * `linkUrl` is null on every banner the service currently holds, so opening
 * falls through to the image itself. That is the more useful target anyway —
 * an agent wants to see the card full size before sending it.
 *
 * What gets sent is always the image, never a link to it — see `prepareFile`,
 * which has two ways to produce one and only gives up if both fail.
 */
function BannerCard({ banner, agent }) {
  const { title, imageUrl, linkUrl } = banner;

  /**
   * The artwork as a file, by whichever route works.
   *
   * Signed when there is an agent to sign it with, and *unsigned* when there is
   * not: `signatureLines(null)` is empty, which `buildBrandedCard` renders as
   * the resized artwork with no strip under it. That case is a real one — an
   * onboarding user 403s on `/posp/me` — and it used to fall through to sharing
   * the URL. A card without a signature is still the card; a link is not.
   *
   * The catch is the same argument one level down. If the canvas cannot run at
   * all — the CORS header gone from `/uploads`, a browser without `toBlob` —
   * the bytes are still fetchable, so fetch them. Only if that fails too does
   * `useShare` have nothing to attach.
   *
   * `useCallback` and not a bare arrow: `CardActions` takes this as a prop, and
   * a new function identity on every render of a 20-card grid would defeat any
   * memoisation added to the buttons later.
   */
  const prepareFile = useCallback(async () => {
    try {
      return await buildBrandedCard({
        imageUrl,
        title,
        lines: signatureLines(agent),
        photoUrl: agent?.photo,
      });
    } catch (err) {
      console.warn('[BannerCard] could not brand the card, sending the artwork as-is', err);
      return fetchAsFile(imageUrl, title);
    }
  }, [imageUrl, title, agent]);

  return (
    <CardShell
      title={title}
      imageUrl={imageUrl}
      href={linkUrl || imageUrl}
      shareUrl={imageUrl || linkUrl}
      shareText={shareCaption(title, agent)}
      prepareFile={imageUrl ? prepareFile : undefined}
      openLabel="View"
    />
  );
}

export default BannerCard;
