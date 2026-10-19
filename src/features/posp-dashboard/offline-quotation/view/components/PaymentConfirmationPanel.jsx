import { CircleCheck, Clock } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/format';
import { formatMethod, formatPayee, paymentStatusMeta } from '../../payments/lib/paymentFormat';
import { useCopied } from '../hooks/useCopied';
import { formatDateTime, hasDate } from '../lib/quotationFormat';
import CopyIconButton from './CopyIconButton';

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
        {label}
      </dt>
      <dd className="font-body-lg text-body-lg mt-0.5 break-words text-on-surface">{children}</dd>
    </div>
  );
}

/** The latest payment recorded against this quote. */
function PaymentConfirmationPanel({ payment }) {
  const { copied, copy } = useCopied();
  const status = paymentStatusMeta(payment.status);
  const success = status.label === 'Success';
  const Icon = success ? CircleCheck : Clock;

  return (
    <section className="anim-fade-d2 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-headline-md text-headline-md text-on-surface">Payment</h3>
        <span
          className={`font-label-caps text-status-pill inline-flex items-center rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ring-1 ring-inset ${status.pill}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-surface-dim/40 p-3.5">
        <Icon
          aria-hidden="true"
          className={`mt-1 size-5 shrink-0 ${success ? 'text-emerald-600' : 'text-amber-600'}`}
        />
        <div className="min-w-0">
          <p className="font-data-currency text-headline-lg text-on-surface">
            {formatCurrency(payment.amount)}
            <span className="font-body-lg text-body-lg text-on-surface-variant"> paid</span>
          </p>
          {hasDate(payment.paidAt) && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              {formatDateTime(payment.paidAt)}
            </p>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        <Fact label="Mode">{formatMethod(payment.method)}</Fact>

        <Fact label="Reference / UTR">
          {payment.utrNo ? (
            <span className="flex items-center gap-1">
              <span className="font-data-mono min-w-0 break-all font-semibold">{payment.utrNo}</span>
              <CopyIconButton
                label="UTR"
                done={copied === 'utr'}
                onClick={() => copy('utr', payment.utrNo)}
              />
            </span>
          ) : (
            <span className="text-on-surface-variant">No UTR yet</span>
          )}
        </Fact>

        {payment.payee && <Fact label="Paid to">{formatPayee(payment.payee)}</Fact>}

        <Fact label="Received">
          {hasDate(payment.receivedAt) ? (
            formatDateTime(payment.receivedAt)
          ) : (
            <span className="text-on-surface-variant">Not yet received</span>
          )}
        </Fact>
      </dl>
    </section>
  );
}

export default PaymentConfirmationPanel;
