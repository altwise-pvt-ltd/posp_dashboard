import CardShell from './CardShell';

/**
 * One brochure: a page preview, its title and blurb, and the PDF behind it.
 *
 * The PDF opens in a new tab rather than downloading: the browser's own viewer
 * is the faster way to read a brochure, and an agent who wants the file can
 * still save it from there.
 */
function BrochureCard({ brochure }) {
  const { title, description, thumbnailUrl, documentUrl } = brochure;

  return (
    <CardShell
      title={title}
      imageUrl={thumbnailUrl}
      href={documentUrl}
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
