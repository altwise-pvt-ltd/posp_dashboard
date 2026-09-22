/**
 * Display formatting for a policy row.
 *
 * The generic money and date formatters are not here — they are in
 * `@/shared/lib/format`, shared with the quotations list. What is left is the
 * formatting that reads fields off a policy, which is the part that could not
 * be shared.
 */

import { formatDate } from '@/shared/lib/format';

/**
 * "Motor · Private Car" — the line of business and, when there is one, the
 * sub-product under it. Joined so a policy with no sub-product doesn't render
 * a trailing separator.
 */
export const formatProduct = (policy) =>
  [policy?.product, policy?.subProduct].filter(Boolean).join(' · ');

/**
 * "12 Oct 2025 — 11 Oct 2026", the cover period as one string.
 *
 * An en dash with spaces, not a hyphen: the two dates already contain spaces,
 * and `11 Oct 2026-10 Oct 2027` reads as one mangled token at the small size
 * this renders in.
 */
export const formatPeriod = (policy) =>
  `${formatDate(policy?.startDate)} – ${formatDate(policy?.endDate)}`;
