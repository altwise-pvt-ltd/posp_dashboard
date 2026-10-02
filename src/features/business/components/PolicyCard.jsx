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
 * same facts are here in three tight lines: customer and premium, product and
 * status, then policy number and end date.
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
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
    >
      {/* Customer and premium share the first line; long names truncate. */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-on-surface">
          {policy.customerName}
        </p>
        <p className="font-data-currency text-data-currency shrink-0 text-on-surface">
          {formatCurrency(policy.premium)}
        </p>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-3">
        <p className="font-body-md text-body-md min-w-0 truncate text-on-surface-variant">
          {formatProduct(policy)}
          {policy.insurer && ` · ${policy.insurer}`}
        </p>
        <PolicyStatusPill status={policy.status} />
      </div>

      <p className="font-data-mono text-data-mono mt-1 truncate text-on-surface-variant">
        {policy.policyNumber} · Ends {formatDate(policy.endDate)}
      </p>

      {expiry && <ExpiryFlag label={expiry} className="mt-1.5" />}
    </button>
  );
}

export default PolicyCard;
