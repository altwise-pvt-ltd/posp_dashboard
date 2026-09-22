import { ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { expiryLabel } from '../lib/policyFilters';
import { formatProduct } from '../lib/policyFormat';
import PolicyStatusPill from './PolicyStatusPill';
import ExpiryFlag from './ExpiryFlag';

/**
 * One policy on a phone.
 *
 * A card rather than a horizontally scrolling table: six columns on a 390px
 * screen means either a scroll nobody discovers or type nobody can read. The
 * same facts are here, reordered for the smaller surface — policy number and
 * status first because that is what an agent scans for, premium given the most
 * weight because it is what they are asked on the call.
 *
 * A <button> and not a <div> with a handler: this is the mobile equivalent of
 * the table's clickable row, and the element that already answers Enter, Space
 * and a screen reader's "button" announcement is the one to use.
 *
 * `text-left` because a button centres its text by default, which would undo
 * every alignment below.
 */
function PolicyCard({ policy, now, onSelect }) {
  const expiry = expiryLabel(policy, now);

  return (
    <button
      type="button"
      onClick={() => onSelect(policy)}
      aria-label={`View policy ${policy.policyNumber}`}
      className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-data-mono text-data-mono font-semibold text-on-surface">
          {policy.policyNumber}
        </span>
        <PolicyStatusPill status={policy.status} />
      </div>

      <p className="mt-2 text-sm font-semibold text-on-surface">{policy.customerName}</p>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {formatProduct(policy)}
        {policy.insurer && ` · ${policy.insurer}`}
      </p>

      {/* The footer rule is the card's only internal divider — premium and
          cover dates are a different kind of fact from the identity above. */}
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="min-w-0">
          <p className="font-data-currency text-data-currency text-on-surface">
            {formatCurrency(policy.premium)}
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Ends {formatDate(policy.endDate)}
          </p>
        </div>

        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
      </div>

      {/* Below the rule rather than beside the status pill: on a phone the top
          row has no width to spare, and the urgency reads better as the card's
          last word than squeezed against the policy number. */}
      {expiry && <ExpiryFlag label={expiry} className="mt-2.5" />}
    </button>
  );
}

export default PolicyCard;
