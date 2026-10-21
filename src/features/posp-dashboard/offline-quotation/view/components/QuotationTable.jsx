import QuotationStatusPill from './QuotationStatusPill';
import QuotationViewAction from './QuotationViewAction';
import { formatDate } from '@/shared/lib/format';
import { formatAge, formatLob, formatSumInsured } from '../lib/quotationFormat';

/**
 * The desktop layout, rendered from `md` up; below that `QuotationCard` takes
 * over. The queue carries no customer (see `quoteQueueApi.js`), so the reference
 * identifies the row, with the workflow remark under it.
 */

/** Index 2 is Sum insured — its header follows the figures under it right. */
const HEADINGS = ['Reference', 'Line of business', 'Sum insured', 'Status', 'Raised', ''];

function QuotationTable({ quotations }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-180 border-collapse text-left">
        <caption className="sr-only">
          Quotations you have raised, newest first
        </caption>

        <thead>
          <tr className="border-b border-hairline-cool">
            {HEADINGS.map((heading, index) => (
              <th
                key={heading || 'actions'}
                scope="col"
                className={`font-label-caps text-label-caps px-3 py-2.5 font-semibold uppercase text-on-surface-variant ${
                  index === 2 ? 'text-right' : ''
                }`}
              >
                {/* The last cell holds the row action and is labelled for
                    assistive tech only. */}
                {heading || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {quotations.map((quotation) => {
            const age = formatAge(quotation.ageDays);

            return (
              <tr
                key={quotation.id ?? quotation.quoteNumber}
                className="border-b border-hairline-soft transition-colors last:border-0 hover:bg-well/70"
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

                <td className="font-body-md text-body-md px-3 py-3 text-on-surface-variant">
                  {formatLob(quotation)}
                </td>

                <td className="font-data-currency text-data-currency px-3 py-3 text-right text-on-surface">
                  {formatSumInsured(quotation.sumInsured)}
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

                <td className="px-3 py-3 text-right">
                  <QuotationViewAction quotation={quotation} />
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
