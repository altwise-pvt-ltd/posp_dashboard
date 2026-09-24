import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * The per-row "open this quote" affordance.
 *
 * Live since `/offline-quotation/view/:quoteId` was built. It stays a component
 * rather than two copies of a link because the table and the card both render
 * one, and this is the single file that decides where a row goes.
 *
 * The target is `quotation.id` — the **uuid**, which is what `GET /quote/<id>`
 * takes. Never `quoteNumber`: the reference is what a human reads down the
 * phone, and the API does not answer to it.
 *
 * A row with no id keeps the old inert treatment. That is not hypothetical —
 * `normalizeRow` nulls an id that arrives blank — and a link to
 * `/offline-quotation/view/undefined` would land on a "not found" page that
 * blames the quote for a problem in the row.
 *
 * `aria-disabled` and not `disabled` on that branch: a disabled button is
 * dropped out of the tab order entirely, which silently removes the only row
 * control from keyboard and screen-reader users rather than explaining itself
 * to them.
 */

const SHELL =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40';

function QuotationViewAction({ quotation, className = '' }) {
  const reference = quotation?.quoteNumber ?? 'this quotation';

  if (!quotation?.id) {
    return (
      <button
        type="button"
        aria-disabled="true"
        title={`Opening ${reference} isn't available yet`}
        aria-label={`View ${reference} — not available yet`}
        className={`${SHELL} cursor-default text-slate-400 ${className}`}
      >
        View
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    );
  }

  return (
    <Link
      to={`/offline-quotation/view/${quotation.id}`}
      aria-label={`View ${reference}`}
      className={`${SHELL} text-slate-500 hover:bg-orange-50 hover:text-orange-700 ${className}`}
    >
      View
      <ChevronRight aria-hidden="true" className="size-4" />
    </Link>
  );
}

export default QuotationViewAction;
