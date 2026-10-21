import QuotationStatusPill from './QuotationStatusPill';
import QuotationViewAction from './QuotationViewAction';
import { formatDate } from '@/shared/lib/format';
import { formatAge, formatLob, formatSumInsured } from '../lib/quotationFormat';

/**
 * One queued quote below `md`; from `md` up `QuotationTable` takes over. The
 * queue carries no customer, so the reference identifies the row.
 */
function QuotationCard({ quotation }) {
  const age = formatAge(quotation.ageDays);

  return (
    <article className="rounded-xl border border-hairline-cool bg-white p-3.5 transition-colors hover:border-hairline-strong">
      <div className="flex items-start justify-between gap-3">
        <span className="font-data-mono text-data-mono font-semibold text-on-surface">
          {quotation.quoteNumber ?? '—'}
        </span>
        <QuotationStatusPill quotation={quotation} />
      </div>

      <p className="font-body-md text-body-md mt-2 text-on-surface-variant">
        {formatLob(quotation)}
      </p>

      {/* A workflow note when there is one. `line-clamp-2` because a remark is
          free text and one long enough to fill the screen would push the
          premium and the action off it. */}
      {quotation.lastRemark && (
        <p className="font-body-md text-body-md mt-1.5 line-clamp-2 rounded-lg bg-well px-2 py-1.5 text-on-surface-variant">
          {quotation.lastRemark}
        </p>
      )}

      {/* The footer rule is the card's only internal divider — the figure and
          the dates are a different kind of fact from the identity above them. */}
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-hairline-soft pt-3">
        <div>
          <p className="font-data-currency text-data-currency text-on-surface">
            {formatSumInsured(quotation.sumInsured)}
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {formatDate(quotation.createdAt)}
            {age && ` · ${age}`}
          </p>
        </div>

        <QuotationViewAction quotation={quotation} className="-mr-1" />
      </div>
    </article>
  );
}

export default QuotationCard;
