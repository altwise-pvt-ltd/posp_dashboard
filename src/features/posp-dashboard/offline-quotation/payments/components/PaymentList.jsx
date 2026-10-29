import { formatCurrencyPreserve, formatDate } from '@/shared/lib/format';
import QuoteLink from '@/features/posp-dashboard/offline-quotation/components/QuoteLink';
import { useOpenQuotation } from '@/features/posp-dashboard/offline-quotation/hooks/useOpenQuotation';
import { formatMethod, formatPayee, paymentStatusMeta } from '@/features/posp-dashboard/offline-quotation/lib/paymentFormat';

function PaymentStatusPill({ status }) {
  const { label, pill } = paymentStatusMeta(status);

  return (
    <span
      className={`font-label-caps text-status-pill inline-flex items-center rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ring-1 ring-inset ${pill}`}
    >
      {label}
    </span>
  );
}

const HEADINGS = ['Quote', 'Proposal', 'Method', 'Amount', 'Status', 'Paid on'];

function PaymentTable({ payments }) {
  const rowLink = useOpenQuotation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 border-collapse text-left">
        <caption className="sr-only">Premium payments, newest first</caption>

        <thead>
          <tr className="border-b border-hairline-cool">
            {HEADINGS.map((heading, index) => (
              <th
                key={heading}
                scope="col"
                className={`font-label-caps text-label-caps px-3 py-2.5 font-semibold uppercase text-on-surface-variant ${
                  index === 3 ? 'text-right' : ''
                }`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => {
            const { className: linkClass = '', ...link } = rowLink(payment.quoteId);

            return (
            <tr
              key={payment.paymentId}
              {...link}
              className={`border-b border-hairline-soft transition-colors last:border-0 hover:bg-well/70 ${linkClass}`}
            >
              <td className="px-3 py-3">
                <QuoteLink
                  quoteId={payment.quoteId}
                  className="font-data-mono text-data-mono font-semibold text-on-surface"
                >
                  {payment.quoteNumber || '—'}
                </QuoteLink>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  To {formatPayee(payment.payee)}
                </p>
              </td>

              <td className="font-data-mono text-data-mono px-3 py-3 text-on-surface-variant">
                {payment.proposalNumber || '—'}
              </td>

              <td className="px-3 py-3">
                <p className="font-body-md text-body-md text-on-surface">
                  {formatMethod(payment.method)}
                </p>
                <p className="font-data-mono text-data-mono text-on-surface-variant">
                  {payment.utrNo ? `UTR ${payment.utrNo}` : 'No UTR yet'}
                </p>
              </td>

              <td className="font-data-currency text-data-currency px-3 py-3 text-right text-on-surface">
                {formatCurrencyPreserve(payment.amount)}
              </td>

              <td className="px-3 py-3">
                <PaymentStatusPill status={payment.status} />
              </td>

              <td className="font-body-md text-body-md px-3 py-3 whitespace-nowrap text-on-surface-variant">
                {formatDate(payment.paidAt)}
                <p className="text-xs">
                  {payment.receivedAt
                    ? `Received ${formatDate(payment.receivedAt)}`
                    : 'Not yet received'}
                </p>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PaymentCard({ payment }) {
  const { className: linkClass = '', ...link } = useOpenQuotation()(payment.quoteId);

  return (
    <div
      {...link}
      className={`rounded-xl border border-slate-200 bg-white px-3 py-2.5 ${linkClass}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-data-mono text-data-mono min-w-0 truncate font-semibold text-on-surface">
          <QuoteLink quoteId={payment.quoteId}>{payment.quoteNumber || '—'}</QuoteLink>
        </p>
        <p className="font-data-currency text-data-currency shrink-0 text-on-surface">
          {formatCurrencyPreserve(payment.amount)}
        </p>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-3">
        <p className="font-body-md text-body-md min-w-0 truncate text-on-surface-variant">
          {formatMethod(payment.method)} · Paid {formatDate(payment.paidAt)}
        </p>
        <PaymentStatusPill status={payment.status} />
      </div>

      <p className="font-data-mono text-data-mono mt-1 min-w-0 truncate text-on-surface-variant">
        {payment.utrNo ? `UTR ${payment.utrNo}` : 'No UTR yet'}
        {payment.proposalNumber && ` · ${payment.proposalNumber}`}
      </p>
    </div>
  );
}

function PaymentList({ payments }) {
  return (
    <>
      <div className="flex flex-col gap-2.5 md:hidden">
        {payments.map((payment) => (
          <PaymentCard key={payment.paymentId} payment={payment} />
        ))}
      </div>

      <div className="hidden md:block">
        <PaymentTable payments={payments} />
      </div>
    </>
  );
}

export default PaymentList;
