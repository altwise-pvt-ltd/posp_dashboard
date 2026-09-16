/**
 * Display formatting for a quotation row.
 *
 * Both the table and the mobile card need these, so they live here rather than
 * being written twice with two different answers for a missing premium.
 */

/**
 * `₹1,24,500` — Indian grouping, no paise.
 *
 * Built once at module scope: `Intl.NumberFormat` is expensive to construct and
 * this runs per row, per render.
 *
 * Fraction digits are pinned to 0 on both ends. A premium is quoted in whole
 * rupees, and letting the default range through would render one row as
 * `₹12,499` and the next as `₹12,499.5`, which reads as a bug in a column of
 * aligned figures.
 */
const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * An em dash, not '₹0' — a draft that has not been priced yet has no premium,
 * and zero is a different claim from "not known".
 */
export const formatPremium = (value) =>
  Number.isFinite(value) ? INR.format(value) : '—';

/** `11 Sep 2026`. Same em dash for an absent or unparseable date. */
export function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * "Motor · Private Car" — the line of business and, when there is one, the
 * sub-product under it. Joined here so a quote with no sub-product doesn't
 * render a trailing separator.
 */
export const formatProduct = (quotation) =>
  [quotation?.product, quotation?.subProduct].filter(Boolean).join(' · ');
