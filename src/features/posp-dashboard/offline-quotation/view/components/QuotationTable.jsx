import QuotationStatusPill from './QuotationStatusPill';
import QuotationViewAction from './QuotationViewAction';
import { formatDate, formatPremium, formatProduct } from '../lib/quotationFormat';

/**
 * The desktop layout. A real <table>, not a grid of divs — these are rows of
 * the same record type and the header cells genuinely label their columns, so
 * the semantics are free and a screen reader announces "Premium, ₹14,250"
 * instead of a bare figure.
 *
 * Rendered from `md` up only; below that `QuotationCard` takes over. See
 * `QuotationList`.
 *
 * Premium is right-aligned and set in the tabular-figure token
 * (`font-data-currency`), so the rupee amounts line up digit-for-digit down the
 * column. That is the whole reason those tokens exist in the theme.
 */
function QuotationTable({ quotations }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200">
            {['Reference', 'Customer', 'Product', 'Premium', 'Status', 'Created', ''].map(
              (heading, index) => (
                <th
                  key={heading || 'actions'}
                  scope="col"
                  /* The premium column is index 3 — its header follows the
                     figures under it to the right edge. The last cell holds the
                     row action and is labelled for assistive tech only. */
                  className={`font-label-caps text-label-caps px-3 py-2.5 font-semibold uppercase text-on-surface-variant ${
                    index === 3 ? 'text-right' : ''
                  }`}
                >
                  {heading || <span className="sr-only">Actions</span>}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {quotations.map((quotation) => (
            <tr
              key={quotation.quoteId}
              className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70"
            >
              <td className="px-3 py-3">
                <span className="font-data-mono text-data-mono font-semibold text-on-surface">
                  {quotation.quoteNumber}
                </span>
              </td>

              <td className="px-3 py-3">
                <p className="text-sm font-medium text-on-surface">{quotation.customerName}</p>
                {/* An unpriced draft often has no contact yet — the line is
                    dropped rather than rendered as an empty one, so rows
                    without it stay a single line tall. */}
                {quotation.customerMobile && (
                  <p className="font-data-mono text-data-mono text-on-surface-variant">
                    {quotation.customerMobile}
                  </p>
                )}
              </td>

              <td className="font-body-md text-body-md px-3 py-3 text-on-surface-variant">
                {formatProduct(quotation)}
              </td>

              <td className="font-data-currency text-data-currency px-3 py-3 text-right text-on-surface">
                {formatPremium(quotation.premium)}
              </td>

              <td className="px-3 py-3">
                <QuotationStatusPill status={quotation.status} />
              </td>

              <td className="font-body-md text-body-md px-3 py-3 whitespace-nowrap text-on-surface-variant">
                {formatDate(quotation.createdAt)}
              </td>

              <td className="px-3 py-3 text-right">
                <QuotationViewAction quotation={quotation} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default QuotationTable;
