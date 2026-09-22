/**
 * Display formatting for a quotation row.
 *
 * The money and date formatters used to be defined here. They are generic —
 * "₹, Indian grouping, no paise" and "11 Sep 2026" are not quotation facts —
 * and the Business module needs the same two answers, so they now live in
 * `@/shared/lib/format`. They are re-exported under the names this module's
 * components already import, so the table and card below are unchanged.
 */

import { formatCurrency, formatDate } from '@/shared/lib/format';

/** A quote's premium. `—` when a draft has not been priced — see the shared module. */
export const formatPremium = formatCurrency;

export { formatDate };

/**
 * "Motor · Private Car" — the line of business and, when there is one, the
 * sub-product under it. Joined here so a quote with no sub-product doesn't
 * render a trailing separator.
 *
 * Stays in this module: it reads fields off a quotation, so it is not the
 * shared kind of formatting.
 */
export const formatProduct = (quotation) =>
  [quotation?.product, quotation?.subProduct].filter(Boolean).join(' · ');
