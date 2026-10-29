import { Pencil, Share2, ShieldCheck, Wallet } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import { daysUntil, formatCurrencyPreserve, formatDate } from '@/shared/lib/format';
import { formatAge, formatProduct, formatSumInsured, hasDate } from '../lib/quotationFormat';
import Fact from './Fact';
import QuotationStatusPill from './QuotationStatusPill';

// The detail page's top card: number, status, actions, key facts and the last remark.
// Each action shows only when its handler is passed.
function QuoteDetailHeader({
  quote,
  payment,
  paid,
  leadEntries,
  onEdit,
  onViewPayment,
  onApply,
  onShare,
}) {
  // The detail reply has no ageDays, so work it out from createdAt.
  const age = formatAge(-(daysUntil(quote.createdAt) ?? 0));

  return (
    <section className="anim-fade-d1 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline-soft pb-4">
        <div className="min-w-0">
          <h1 className="font-data-mono text-headline-lg font-semibold text-on-surface">
            {quote.quoteNumber || 'Quotation'}
          </h1>
          {(quote.lob || quote.product) && (
            <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
              {formatProduct(quote)}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <QuotationStatusPill quotation={quote} />

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {onEdit && (
              <CustomButton variant="primary" size="md" leftIcon={<Pencil />} onClick={onEdit}>
                Edit
              </CustomButton>
            )}

            {onViewPayment && (
              <CustomButton
                variant="primary"
                size="md"
                leftIcon={<Wallet />}
                onClick={onViewPayment}
              >
                View payment instruction
              </CustomButton>
            )}

            {onApply && (
              <CustomButton variant="primary" size="md" leftIcon={<ShieldCheck />} onClick={onApply}>
                Submit for verification
              </CustomButton>
            )}

            {onShare && (
              <CustomButton variant="secondary" size="md" leftIcon={<Share2 />} onClick={onShare}>
                Share
              </CustomButton>
            )}
          </div>
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
        {Number.isFinite(quote.sumInsured) && (
          <Fact label="Sum insured">{formatSumInsured(quote.sumInsured)}</Fact>
        )}
        {paid && Number.isFinite(payment.amount) ? (
          <Fact label="Premium paid">{formatCurrencyPreserve(payment.amount)}</Fact>
        ) : (
          Number.isFinite(quote.expectedPremium) && (
            <Fact label="Expected premium">{formatSumInsured(quote.expectedPremium)}</Fact>
          )
        )}
        {quote.fileType && <Fact label="Case type">{quote.fileType}</Fact>}
        {leadEntries.map((entry) => (
          <Fact key={entry.code} label={entry.label}>
            {entry.text}
          </Fact>
        ))}

        {!paid && hasDate(quote.createdAt) && (
          <Fact label="Raised">
            {formatDate(quote.createdAt)}
            {age && (
              <span className="font-body-md text-body-md text-on-surface-variant">
                {' · '}
                {age}
              </span>
            )}
          </Fact>
        )}
        {!paid && hasDate(quote.updatedAt) && (
          <Fact label="Last updated">{formatDate(quote.updatedAt)}</Fact>
        )}
        {quote.originatorName && <Fact label="Raised by">{quote.originatorName}</Fact>}
      </dl>

      {quote.lastRemark && (
        <div className="mt-4 border-t border-hairline-soft pt-4">
          <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
            Last remark
          </p>
          <p className="font-body-md text-body-md mt-1 rounded-lg bg-well px-3 py-2 text-on-surface">
            {quote.lastRemark}
          </p>
        </div>
      )}
    </section>
  );
}

export default QuoteDetailHeader;
