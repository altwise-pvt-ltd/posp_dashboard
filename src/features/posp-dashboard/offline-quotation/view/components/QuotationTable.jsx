import QuotationStatusPill from './QuotationStatusPill';
import { formatDate } from '@/shared/lib/format';
import { useOpenQuotation } from '../hooks/useOpenQuotation';
import { formatAge, formatPremium, formatProduct, formatSumInsured } from '../lib/quotationFormat';

/**
 * The desktop layout, rendered from `md` up; below that `QuotationCard` takes
 * over. The queue carries no customer (see `quoteQueueApi.js`), so the reference
 * identifies the row, with the workflow remark under it.
 */

const HEADINGS = ['Reference', 'Product', 'Sum insured', 'Premium', 'Status', 'Raised'];

// Money columns are right-aligned, headers included.
const RIGHT_ALIGNED = new Set([2, 3]);

function QuotationTable({ quotations }) {
  const rowLink = useOpenQuotation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-210 border-collapse text-left">
        <caption className="sr-only">
          Quotations you have raised, newest first
        </caption>

        <thead>
          <tr className="border-b border-hairline-cool">
            {HEADINGS.map((heading, index) => (
              <th
                key={heading}
                scope="col"
                className={`font-label-caps text-label-caps px-3 py-2.5 font-semibold uppercase text-on-surface-variant ${
                  RIGHT_ALIGNED.has(index) ? 'text-right' : ''
                }`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {quotations.map((quotation) => {
            const age = formatAge(quotation.ageDays);
            const { className: linkClass = '', ...link } = rowLink(quotation.id);

            return (
              <tr
                key={quotation.id ?? quotation.quoteNumber}
                {...link}
                className={`border-b border-hairline-soft transition-colors last:border-0 hover:bg-well/70 ${linkClass}`}
              >
                <td className="px-3 py-3">
                  <span className="font-data-mono text-data-mono font-semibold text-on-surface">
                    {quotation.quoteNumber ?? '—'}
                  </span>
                  {/* Most rows have no remark — the line is dropped rather than
                      rendered empty, so they stay a single line tall. */}
                  {quotation.lastRemark && (
                    <p className="font-body-md text-body-md max-w-xs truncate text-on-surface-variant">
                      {quotation.lastRemark}
                    </p>
                  )}
                </td>

                <td className="font-body-md text-body-md px-3 py-3 whitespace-nowrap text-on-surface-variant">
                  {formatProduct(quotation)}
                </td>

                <td className="font-data-currency text-data-currency px-3 py-3 text-right text-on-surface">
                  {formatSumInsured(quotation.sumInsured)}
                </td>

                <td className="px-3 py-3 text-right">
                  <p className="font-data-currency text-data-currency text-on-surface">
                    {formatPremium(quotation.premium)}
                  </p>
                  {quotation.insurerName && (
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {quotation.insurerName}
                    </p>
                  )}
                </td>

                <td className="px-3 py-3">
                  <QuotationStatusPill quotation={quotation} />
                </td>

                <td className="px-3 py-3 whitespace-nowrap">
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {formatDate(quotation.createdAt)}
                  </p>
                  {/* The operative fact in a queue: how long it has sat. */}
                  {age && (
                    <p className="font-body-md text-body-md text-on-surface-variant/70">{age}</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default QuotationTable;
