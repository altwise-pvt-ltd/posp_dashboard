import { Link } from 'react-router-dom';

/**
 * The per-row link to one quote, rendered by both the table and the card.
 *
 * Targets `quotation.id` — the uuid `GET /quote/<id>` takes, never
 * `quoteNumber`, which the API does not answer to. A row whose id arrived blank
 * (`normalizeRow` nulls it) renders inert instead of linking, and stays in the
 * tab order via `aria-disabled`.
 */

const SHELL =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40';

function QuotationViewAction({ quotation, className = '' }) {
  const reference = quotation?.quoteNumber ?? 'this quotation';

  if (!quotation?.id) {
    return (
      <button
        type="button"
        aria-disabled="true"
        title={`Opening ${reference} isn't available yet`}
        aria-label={`View ${reference} — not available yet`}
        className={`${SHELL} cursor-default text-ink-faint ${className}`}
      >
        View
      </button>
    );
  }

  return (
    <Link
      to={`/offline-quotation/view/${quotation.id}`}
      state={{ fromList: true }}
      aria-label={`View ${reference}`}
      className={`${SHELL} text-ink-subtle hover:bg-orange-50 hover:text-orange-700 ${className}`}
    >
      View
    </Link>
  );
}

export default QuotationViewAction;
