import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * The pager under the list.
 *
 * Numbered pages, not "load more": a policy book is looked through rather than
 * scrolled to the end of, and an agent who was on page three when they opened
 * a drawer expects page three when they close it. "Load more" also grows the
 * table's scroller without bound, which is the thing the fixed-height viewport
 * in `PolicyTable` exists to prevent.
 *
 * The count line is the other half of the control. With the table clipped to
 * its own box, the list no longer ends where the page ends — "Showing 11–20 of
 * 27" is what tells the reader how much book is behind the scrollbar.
 *
 * Drawn for both layouts. On a phone the numbers wrap under the count line
 * rather than shrinking: tap targets stay a finger wide.
 */
function PolicyPagination({ page, pageCount, rangeStart, rangeEnd, total, onPageChange }) {
  // One page is no decision to make — the count line still earns its place,
  // the buttons don't.
  const single = pageCount <= 1;

  const go = (next) => {
    const clamped = Math.min(Math.max(next, 1), pageCount);
    if (clamped !== page) onPageChange(clamped);
  };

  const stepClass =
    'inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 disabled:hover:border-slate-100';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
      {/* `aria-live` so a screen reader hears the range change after a page
          step — the rows themselves are swapped out silently. */}
      <p aria-live="polite" className="font-body-md text-body-md text-on-surface-variant">
        Showing{' '}
        <span className="font-data-mono text-data-mono text-on-surface">
          {rangeStart}–{rangeEnd}
        </span>{' '}
        of <span className="font-data-mono text-data-mono text-on-surface">{total}</span>
      </p>

      {!single && (
        <nav aria-label="Policy pages" className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => go(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className={stepClass}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>

          {pageWindow(page, pageCount).map((entry, index) =>
            entry === GAP ? (
              // Not a button, and not announced — it stands for pages the
              // window skipped, which the numbers either side already imply.
              <span
                key={`gap-${index}`}
                aria-hidden="true"
                className="px-1 text-sm text-slate-400"
              >
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => go(entry)}
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? 'page' : undefined}
                className={`font-data-mono text-data-mono inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
                  entry === page
                    ? 'border-orange-200 bg-orange-50 font-semibold text-orange-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {entry}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page === pageCount}
            aria-label="Next page"
            className={stepClass}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </nav>
      )}
    </div>
  );
}

/** Stands in for a run of hidden page numbers. A symbol rather than the
 *  string '…', so it can never be mistaken for a page number. */
const GAP = Symbol('gap');

/**
 * The page numbers to draw: always the first and last, always the current one
 * and its neighbours, ellipses for the rest.
 *
 * Fixed at seven slots wide so the nav doesn't change width as you step
 * through it — a Next button that moves out from under the cursor between
 * clicks is a control that punishes using it.
 */
function pageWindow(page, pageCount) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  // Near either end the window slides flush against it rather than centring on
  // the current page, which would waste a slot on an ellipsis hiding one page.
  if (page <= 4) return [1, 2, 3, 4, 5, GAP, pageCount];
  if (page >= pageCount - 3) {
    return [1, GAP, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, GAP, page - 1, page, page + 1, GAP, pageCount];
}

export default PolicyPagination;
