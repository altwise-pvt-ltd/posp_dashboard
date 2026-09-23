import { ArrowUpRight, ImageOff } from 'lucide-react';
import { useState } from 'react';

/**
 * The frame both card types share: a landscape preview, the details beneath it,
 * and one action.
 *
 * Landscape, with the artwork *contained* rather than cropped — which is a
 * deliberate pairing of two things that fight each other. A 16:9 box shows more
 * cards per screen and gives the grid a steady rhythm whatever shape the
 * artwork is; `contain` keeps the whole card visible, which matters because the
 * artwork is the product an agent is about to send a customer, and the live
 * library ranges from 0.667 to 1.0 (see `BannerCard`).
 *
 * The cost is that portrait art only fills about 44% of a 16:9 box's width. The
 * blurred backdrop below is what makes that read as a frame rather than as dead
 * space — same `src`, so it is one download and one decode, painted twice.
 *
 * Display only: the preview, the title, and the link that opens the artwork or
 * the PDF.
 */
function CardShell({ title, imageUrl, href, children, openLabel = 'Open', unavailableLabel }) {
  /* An image can 404 even with a well-formed URL — the uploads host is a
   * separate concern from the API that named the file. */
  const [broken, setBroken] = useState(false);
  const showImage = imageUrl && !broken;

  const preview = (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container">
        {showImage ? (
          <>
            {/*
              The backdrop. `aria-hidden` and no alt text — it carries no
              information the contained copy below does not, and a screen reader
              announcing the same card twice is just noise.
            */}
            <img
              src={imageUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full scale-110 object-cover blur-xl"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-white/30" />

            {/*
             * ⚠ WEIGHT — the service serves the full-resolution original here.
             * The banners measured 2444×3128 at 1.3–3.7 MB each, so a category
             * of two is ~7 MB to draw two previews, and an agent on mobile data
             * pays for all of it.
             *
             * `loading="lazy"` and `decoding="async"` are the whole of what the
             * client can do. The fix is a resized variant from the service —
             * the brochures already prove the shape, with `thumbnailUrl`
             * separate from `documentUrl`. Until `/api/banners` grows the same,
             * this grid is heavy by the API's design, not the page's.
             */}
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              onError={() => setBroken(true)}
              className="relative size-full object-contain transition duration-300 group-hover:scale-[1.03]"
            />
          </>
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageOff aria-hidden="true" className="size-6 text-on-surface-variant" />
          </div>
        )}

        {/* Always on at phone width, where there is no hover to reveal it — a
            hover-only affordance is one touch users never get. From `sm` up it
            fades in on hover and on keyboard focus, because a focus-only cue is
            invisible to a mouse and the reverse to a keyboard. */}
        {href && (
          <span
            aria-hidden="true"
            className="font-body-md text-body-md pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-lg bg-on-surface/85 px-2 py-1 text-white transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          >
            {openLabel}
          <ArrowUpRight className="size-3.5" />
        </span>
      )}
    </div>
  );

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {preview}
        </a>
      ) : (
        preview
      )}

      {/* `flex-1` so bodies of different lengths still line up the bottom edge
          of every card across a row.

          The title is drawn here rather than passed in as a child: both card
          types were rendering the identical span, which is two places for one
          piece of styling to drift. `children` carries only what differs — the
          brochure's blurb. */}
      <div className="flex flex-1 flex-col gap-1 px-3 pt-2.5 pb-2">
        <span className="font-body-md text-body-md truncate text-on-surface">{title}</span>
        {children}
      </div>

      {/* Only drawn when there is nothing to open. Rendering the strip
          unconditionally would put an empty bordered rule under the title of
          every card that does have a link. */}
      {!href && unavailableLabel && (
        <div className="border-t border-gray-100 px-3 py-1.5">
          <span className="font-body-md text-body-md truncate text-on-surface-variant italic">
            {unavailableLabel}
          </span>
        </div>
      )}
    </article>
  );
}

export default CardShell;
