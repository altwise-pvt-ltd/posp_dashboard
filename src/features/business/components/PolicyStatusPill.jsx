import { statusMeta } from '../lib/policyStatus';

/**
 * The one place a policy's status becomes something visible.
 *
 * `ring` rather than `border`: the pill sits inside table cells and card rows
 * whose heights are set by the text beside it, and a ring draws outside the box
 * without adding a pixel to it.
 */
function PolicyStatusPill({ status, className = '' }) {
  const { label, pill } = statusMeta(status);

  return (
    <span
      className={`font-label-caps text-status-pill inline-flex items-center rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ring-1 ring-inset ${pill} ${className}`}
    >
      {label}
    </span>
  );
}

export default PolicyStatusPill;
