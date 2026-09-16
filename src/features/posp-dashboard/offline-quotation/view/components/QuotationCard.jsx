import QuotationStatusPill from './QuotationStatusPill';
import QuotationViewAction from './QuotationViewAction';
import { formatDate, formatPremium, formatProduct } from '../lib/quotationFormat';

/**
 * One quotation on a phone.
 *
 * A card rather than a horizontally scrolling table: seven columns on a 390px
 * screen means either a scroll nobody discovers or type nobody can read. The
 * same six facts are here, reordered for the smaller surface — reference and
 * status first because that is what an agent scans for, premium given the most
 * weight because it is what they are asked on the call.
 */
function QuotationCard({ quotation }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <span className="font-data-mono text-data-mono font-semibold text-on-surface">
          {quotation.quoteNumber}
        </span>
        <QuotationStatusPill status={quotation.status} />
      </div>

      <p className="mt-2 text-sm font-semibold text-on-surface">{quotation.customerName}</p>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {formatProduct(quotation)}
        {quotation.customerMobile && ` · ${quotation.customerMobile}`}
      </p>

      {/* The footer rule is the card's only internal divider — premium and date
          are a different kind of fact from the identity above them. */}
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="font-data-currency text-data-currency text-on-surface">
            {formatPremium(quotation.premium)}
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {formatDate(quotation.createdAt)}
          </p>
        </div>

        <QuotationViewAction quotation={quotation} className="-mr-1" />
      </div>
    </article>
  );
}

export default QuotationCard;
