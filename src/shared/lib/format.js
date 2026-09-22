/**
 * Money and date formatting, for every module that renders either.
 *
 * Lifted out of `offline-quotation/view/lib/quotationFormat.js`, which is where
 * these two were written first and where their reasoning is worth keeping: a
 * premium is quoted in whole rupees, and an absent value is not zero. Business
 * needs the identical answers, and a second copy is how a codebase ends up
 * rendering `₹14,250` in one table and `₹14,250.00` in the next.
 *
 * Only the genuinely shared pair lives here. Anything that reads a field off a
 * particular record — `formatProduct(quotation)` — stays with its own module.
 */

/**
 * `₹1,24,500` — Indian grouping, no paise.
 *
 * Built once at module scope: `Intl.NumberFormat` is expensive to construct and
 * this runs per row, per render.
 *
 * Fraction digits are pinned to 0 on both ends. Letting the default range
 * through would render one row as `₹12,499` and the next as `₹12,499.5`, which
 * reads as a bug in a column of aligned figures.
 */
const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * An em dash, not '₹0' — a record with no amount yet has no amount, and zero is
 * a different claim from "not known".
 */
export const formatCurrency = (value) =>
  Number.isFinite(value) ? INR.format(value) : '—';

/**
 * `₹14.2L` / `₹1.4Cr` — the short form, for summary tiles where the full
 * figure would wrap.
 *
 * Lakh and crore rather than K/M: the audience is Indian insurance agents, and
 * `₹14.2L` is how they say it out loud. Below a lakh the exact rupee figure
 * fits, so it is used unchanged rather than rendered as `₹0.1L`.
 *
 * One decimal always, with a trailing `.0` stripped — `₹14.2L`, but `₹5L`.
 * Scaling the precision by magnitude instead (fewer decimals as the number
 * grows) reads as tidier and isn't: it renders ₹14,20,000 as `₹14L`, losing
 * ₹20,000 from a figure only six characters long, and this dashboard's numbers
 * sit squarely in that range.
 */
export function formatCompactCurrency(value) {
  if (!Number.isFinite(value)) return '—';

  const abs = Math.abs(value);
  const short = (scaled, suffix) =>
    `₹${scaled.toFixed(1).replace(/\.0$/, '')}${suffix}`;

  if (abs >= 1e7) return short(value / 1e7, 'Cr');
  if (abs >= 1e5) return short(value / 1e5, 'L');

  return INR.format(value);
}

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
 * Whole days from today until `value`; negative once it is past, null when
 * there is no usable date.
 *
 * Both ends are floored to local midnight before subtracting. Comparing raw
 * timestamps makes the answer depend on the time of day — a policy ending
 * tonight reads as 0 days at 9am and -1 at 11pm — and every caller here is
 * asking a calendar question, not a stopwatch one.
 */
export function daysUntil(value, from = new Date()) {
  if (!value) return null;

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;

  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  return Math.round((midnight(target) - midnight(from)) / 86_400_000);
}
