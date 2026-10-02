import { useEffect, useRef } from 'react';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { expiryLabel } from '../lib/policyFilters';
import { formatProduct } from '../lib/policyFormat';
import PolicyStatusPill from './PolicyStatusPill';
import ExpiryFlag from './ExpiryFlag';

function PolicyTable({ policies, now, onSelect }) {
  const headings = ['Policy no.', 'Customer', 'Product', 'Premium', 'Status', 'Cover ends'];

  const viewport = useRef(null);

  /**
   * Back to the top whenever the rows change — a page step, a filter, a
   * re-sort. `policies` is memoised upstream, so this fires on a genuinely new
   * slice and not on every render. Without it, stepping to page 2 lands the
   * reader halfway down it, at the offset page 1 was left at.
   */
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0 });
  }, [policies]);

  return (
    <div
      ref={viewport}
      /* `overscroll-contain` so reaching the bottom of the rows doesn't hand
         the wheel back to the page and scroll the whole dashboard. */
      className="max-h-[min(60vh,30rem)] overflow-auto overscroll-contain rounded-lg border border-slate-200"
    >
      <table className="w-full min-w-200 border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {headings.map((heading, index) => (
              <th
                key={heading}
                scope="col"
                /* The premium column is index 3 — its header follows the
                   figures under it to the right edge.

                   `bg-white` is load-bearing, not decoration: a transparent
                   sticky header lets the rows show through as they pass under
                   it. */
                className={`font-label-caps text-label-caps sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2.5 font-semibold uppercase text-on-surface-variant ${
                  index === 3 ? 'text-right' : ''
                }`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {policies.map((policy) => {
            const expiry = expiryLabel(policy, now);

            return (
              <tr
                key={policy.policyId}
                role="button"
                tabIndex={0}
                aria-label={`View policy ${policy.policyNumber}`}
                onClick={() => onSelect(policy)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(policy);
                  }
                }}
                /* The row rule is drawn by the cells (see the note above), so
                   the last row's is dropped from them too — the scroller's own
                   border already closes the list off. */
                className="cursor-pointer transition-colors [&:last-child>td]:border-b-0 hover:bg-slate-50/70 focus-visible:bg-orange-50/60 focus-visible:outline-none"
              >
                <td className="border-b border-slate-100 px-3 py-3">
                  <span className="font-data-mono text-data-mono font-semibold text-on-surface">
                    {policy.policyNumber}
                  </span>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {policy.insurer}
                  </p>
                </td>

                <td className="border-b border-slate-100 px-3 py-3">
                  <p className="text-sm font-medium text-on-surface">{policy.customerName}</p>
                  {/* Not every record has a contact — the line is dropped
                      rather than rendered empty, so rows without one stay a
                      single line tall. */}
                  {policy.customerMobile && (
                    <p className="font-data-mono text-data-mono text-on-surface-variant">
                      {policy.customerMobile}
                    </p>
                  )}
                </td>

                <td className="font-body-md text-body-md border-b border-slate-100 px-3 py-3 text-on-surface-variant">
                  {formatProduct(policy)}
                </td>

                <td className="font-data-currency text-data-currency border-b border-slate-100 px-3 py-3 text-right text-on-surface">
                  {formatCurrency(policy.premium)}
                </td>

                <td className="border-b border-slate-100 px-3 py-3">
                  {/* Status and urgency stack rather than sit side by side:
                      inline, the two pills set this column's width for every
                      row, including the majority that carry only one. */}
                  <div className="flex flex-col items-start gap-1">
                    <PolicyStatusPill status={policy.status} />
                    <ExpiryFlag label={expiry} />
                  </div>
                </td>

                <td className="font-body-md text-body-md border-b border-slate-100 px-3 py-3 whitespace-nowrap text-on-surface-variant">
                  {formatDate(policy.endDate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PolicyTable;
