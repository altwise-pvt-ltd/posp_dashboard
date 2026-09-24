/**
 * Display formatting for a queue row.
 *
 * The money and date formatters used to be defined here. They are generic —
 * "₹, Indian grouping, no paise" and "11 Sep 2026" are not quotation facts —
 * and the Business module needs the same two answers, so they now live in
 * `@/shared/lib/format`. Only what reads a field off a queue row stays here.
 */

import { formatCurrency, formatDate } from '@/shared/lib/format';

/**
 * A quote's sum insured. `—` when a draft has not been priced.
 *
 * ⚠ Sum insured, not premium. The queue carries no premium at all, and the two
 * are nowhere near each other in size — labelling this one "Premium" would put
 * a ₹5,00,000 cover where an agent expects a ₹14,250 bill.
 */
export const formatSumInsured = formatCurrency;

export { formatDate };

/**
 * "Motor · Two Wheeler" — the line of business and the product under it.
 *
 * Joined here so a row missing either side doesn't render a dangling
 * separator, and returns `—` rather than an empty cell when it has neither:
 * a blank table cell reads as a rendering fault, an em dash reads as no answer.
 */
export const formatProduct = (row) =>
  [row?.lob, row?.product].filter(Boolean).join(' · ') || '—';

/**
 * How long this quote has been sitting — "today", "yesterday", "13 days old".
 *
 * `ageDays` is computed server-side, which is the right place for it: the
 * client's clock can be wrong and its timezone usually is, and every row in a
 * queue is being compared against every other one.
 *
 * Age rather than only the date because this is a *queue*. "10 Sep 2026" needs
 * arithmetic before it means anything; "13 days old" is the fact the agent is
 * actually sorting on.
 */
export const formatAge = (days) => {
  if (!Number.isFinite(days) || days < 0) return null;
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';

  return `${days} days old`;
};
