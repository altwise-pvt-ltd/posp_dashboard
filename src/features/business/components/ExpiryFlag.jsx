import { Clock } from 'lucide-react';

/**
 * "Expires in 12 days" — the derived urgency, drawn *beside* the status pill
 * rather than instead of it.
 *
 * That pairing is the whole point. An expiring policy is still ACTIVE, and the
 * agent needs both facts: the pill says the cover is in force, this says it
 * won't be for long. Folding the two into one pill would have lost the first.
 *
 * Orange, and the only place in this module that uses it — the status table
 * gives its four states emerald, slate and rose precisely so the brand colour
 * is free to mean "act on this".
 *
 * Renders nothing when there is nothing urgent to say, so callers can drop it
 * in unconditionally.
 */
function ExpiryFlag({ label, className = '' }) {
  if (!label) return null;

  return (
    <span
      className={`font-label-caps text-status-pill inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-orange-700 ring-1 ring-inset ring-orange-100 ${className}`}
    >
      <Clock aria-hidden="true" className="size-3" />
      {label}
    </span>
  );
}

export default ExpiryFlag;
