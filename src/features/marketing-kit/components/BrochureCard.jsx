import CardShell from './CardShell';
import { shareCaption } from '../lib/agentSignature';

/**
 * One brochure: a page preview, its title and blurb, and the PDF behind it.
 *
 * The PDF opens in a new tab rather than downloading: the browser's own viewer
 * is the faster way to check a brochure before sharing it, and an agent who
 * wants the file can still save it from there.
 *
 * No branding strip, unlike a banner — the shared artefact is a PDF, and a
 * canvas cannot draw one. The agent's details ride along as the share caption
 * instead, which some targets keep and some drop; a brochure is company
 * collateral that already carries company contacts, so losing the caption costs
 * less here than it would on a greeting card. Stamping the PDF itself would
 * need a PDF library and belongs with the unbuilt delivery work.
 */
function BrochureCard({ brochure, agent }) {
  return (
    <CardShell
      title={brochure.title}
      imageUrl={brochure.thumbnailUrl}
      href={brochure.documentUrl}
      shareText={shareCaption(brochure.title, agent)}
      openLabel="Open PDF"
      unavailableLabel="Not published"
    >
      {brochure.description && (
        /* Two lines, then clipped: the blurb hints at what the brochure covers,
           and letting it set the card's height would give a ragged grid. */
        <span className="font-body-md text-body-md line-clamp-2 text-on-surface-variant">
          {brochure.description}
        </span>
      )}
    </CardShell>
  );
}

export default BrochureCard;
