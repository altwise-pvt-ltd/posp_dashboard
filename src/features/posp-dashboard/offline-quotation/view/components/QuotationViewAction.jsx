import { ChevronRight } from 'lucide-react';

/**
 * The per-row "open this quote" affordance.
 *
 * There is no detail page yet, so this is inert — the same answer the sidebar
 * gives an unbuilt path (see `isRoutedPath` in `app/routes.js`): the control
 * stays visible and in position, but it does not navigate and does not pretend
 * it can. It is a component rather than two copies of a `<button disabled>` so
 * that the day `/offline-quotation/view/:quoteId` exists, one file turns every
 * row in both layouts live.
 *
 * `aria-disabled` and not `disabled`: a disabled button is dropped out of the
 * tab order entirely, which silently removes the only row control from keyboard
 * and screen-reader users rather than explaining itself to them.
 */
function QuotationViewAction({ quotation, className = '' }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title={`Opening ${quotation.quoteNumber} isn't available yet`}
      aria-label={`View ${quotation.quoteNumber} — not available yet`}
      onClick={(event) => event.preventDefault()}
      className={`inline-flex cursor-default items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${className}`}
    >
      View
      <ChevronRight aria-hidden="true" className="size-4" />
    </button>
  );
}

export default QuotationViewAction;
