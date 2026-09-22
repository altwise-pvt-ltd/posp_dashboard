/**
 * Placeholder cards in the shape of the grid that is coming.
 *
 * Replaces a centred spinner, which collapsed the panel to a couple of hundred
 * pixels and then snapped it to full height when the data landed — the page
 * visibly jumping every time a category was tapped. These occupy the same
 * footprint as the real cards, so arriving data swaps in without moving
 * anything below it. The 16:9 preview is the same box `CardShell` sets.
 *
 * `aria-hidden` with a live label above it: to a screen reader six fake cards
 * are noise, and "Loading" said once is the whole message.
 */
function KitSkeleton({ count = 6, columns }) {
  return (
    <>
      <span className="sr-only" role="status">
        Loading…
      </span>

      <div aria-hidden="true" className={`grid gap-3 ${columns}`}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="aspect-[16/9] w-full animate-pulse bg-surface-container" />
            <div className="flex flex-col gap-2 px-3 py-2.5">
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-container" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-container" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default KitSkeleton;
