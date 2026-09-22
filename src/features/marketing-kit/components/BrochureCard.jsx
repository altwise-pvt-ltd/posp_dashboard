import { useCallback } from 'react';
import CardShell from './CardShell';
import { shareCaption } from '../lib/agentSignature';
import { fetchAsFile } from '../lib/remoteFile';

/**
 * One brochure: a page preview, its title and blurb, and the PDF behind it.
 *
 * The PDF opens in a new tab rather than downloading: the browser's own viewer
 * is the faster way to check a brochure before sharing it, and an agent who
 * wants the file can still save it from there.
 *
 * Sharing attaches the PDF itself — the same rule as a banner, and the reason
 * `prepareFile` is here rather than the card settling for a link. What it does
 * *not* get is a signature: a canvas cannot draw a PDF, so the agent's details
 * ride along as the share caption, which some targets keep and some drop. A
 * brochure is company collateral that already carries company contacts, so
 * losing the caption costs less here than it would on a greeting card.
 * Stamping the document itself would need a PDF library and belongs with the
 * unbuilt delivery work.
 */
function BrochureCard({ brochure, agent }) {
  const { title, description, thumbnailUrl, documentUrl } = brochure;

  const prepareFile = useCallback(() => fetchAsFile(documentUrl, title), [documentUrl, title]);

  return (
    <CardShell
      title={title}
      imageUrl={thumbnailUrl}
      href={documentUrl}
      shareText={shareCaption(title, agent)}
      prepareFile={documentUrl ? prepareFile : undefined}
      openLabel="Open PDF"
      unavailableLabel="Not published"
    >
      {description && (
        /* Two lines, then clipped: the blurb hints at what the brochure covers,
           and letting it set the card's height would give a ragged grid. */
        <span className="font-body-md text-body-md line-clamp-2 text-on-surface-variant">
          {description}
        </span>
      )}
    </CardShell>
  );
}

export default BrochureCard;
