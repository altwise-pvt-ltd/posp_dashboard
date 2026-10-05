import { formatCurrency, formatDate } from '@/shared/lib/format';
import QuotationViewAction from '../../view/components/QuotationViewAction';
import { formatMethod, formatPayee, paymentStatusMeta } from '../lib/paymentFormat';

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

// QuotationViewAction expects a queue row; a payment carries the same two fields.
const quoteOf = (payment) => ({ id: payment.quoteId, quoteNumber: payment.quoteNumber });

/** Index 3 is Amount — its header follows the figures right. */
const HEADINGS = ['Quote', 'Proposal', 'Method', 'Amount', 'Status', 'Paid on', ''];

function PaymentTable({ payments }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 border-collapse text-left">
        <caption className="sr-only">Premium payments, newest first</caption>

        <thead>
          <tr className="border-b border-hairline-cool">
            {HEADINGS.map((heading, index) => (
              <th
                key={heading || 'actions'}
                scope="col"
                className={`font-label-caps text-label-caps px-3 py-2.5 font-semibold uppercase text-on-surface-variant ${
                  index === 3 ? 'text-right' : ''
                }`}
              >
                {heading || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => (
            <tr
              key={payment.paymentId}
              className="border-b border-hairline-soft transition-colors last:border-0 hover:bg-well/70"
            >
              <td className="px-3 py-3">
                <span className="font-data-mono text-data-mono font-semibold text-on-surface">
                  {payment.quoteNumber || '—'}
                </span>
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
                {formatCurrency(payment.amount)}
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

              <td className="px-3 py-3 text-right">
                <QuotationViewAction quotation={quoteOf(payment)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentCard({ payment }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-data-mono text-data-mono min-w-0 truncate font-semibold text-on-surface">
          {payment.quoteNumber || '—'}
        </p>
        <p className="font-data-currency text-data-currency shrink-0 text-on-surface">
          {formatCurrency(payment.amount)}
        </p>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-3">
        <p className="font-body-md text-body-md min-w-0 truncate text-on-surface-variant">
          {formatMethod(payment.method)} · Paid {formatDate(payment.paidAt)}
        </p>
        <PaymentStatusPill status={payment.status} />
      </div>

      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="font-data-mono text-data-mono min-w-0 truncate text-on-surface-variant">
          {payment.utrNo ? `UTR ${payment.utrNo}` : 'No UTR yet'}
          {payment.proposalNumber && ` · ${payment.proposalNumber}`}
        </p>
        <QuotationViewAction quotation={quoteOf(payment)} className="-mr-2 shrink-0" />
      </div>
    </div>
  );
}

/** Cards below `md`, the table from `md` up — the same split as QuotationList. */
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
