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
 * `₹14,250.50` — paise always shown, for a sum actually transacted: what the
 * agent is told to pay and what the server recorded as paid.
 *
 * Pinned to 2 digits on both ends, so paise never round away and a whole rupee
 * still reads as money. Two is the limit: the paisa is the smallest unit INR
 * has, no transfer can move less, and the amount field itself accepts at most
 * two decimals. Use `formatCurrency` for cover, premiums and other figures
 * being summarised rather than paid.
 */
const INR_EXACT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrencyExact = (value) =>
  Number.isFinite(value) ? INR_EXACT.format(value) : '—';

/**
 * Exact amount display: preserves the exact decimal precision from the backend.
 * No rounding, padding, or truncation. Uses Indian number formatting (₹, comma grouping).
 *
 * ⚠ Limitation: JSON parsing converts `1250.00` (string) to `1250` (number), losing
 * trailing zeros. Pass the original string from the backend if exact zeros matter.
 * Document this when inspecting call sites.
 *
 * Examples:
 * - formatCurrencyPreserve(1250) → "₹1,250" (no decimals in source)
 * - formatCurrencyPreserve("1250.00") → "₹1,250.00" (preserves trailing zeros)
 * - formatCurrencyPreserve(1250.004) → "₹1,250.004" (preserves all precision)
 */
export const formatCurrencyPreserve = (value) => {
  if (value === null || value === undefined || value === '') return '—';

  const str = String(value).trim();
  if (!str || str === 'NaN') return '—';

  const isNegative = str.startsWith('-');
  const absStr = isNegative ? str.slice(1) : str;

  const [integerPart, decimalPart] = absStr.split('.');

  // Indian grouping: 1,23,45,67,890 (groups of 2 after first group of 3)
  let integer = integerPart;
  if (integer.length > 3) {
    const lastThree = integer.slice(-3);
    const beforeLastThree = integer.slice(0, -3);
    integer = beforeLastThree.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  const amount = decimalPart ? `${integer}.${decimalPart}` : integer;
  return `₹${isNegative ? '-' : ''}${amount}`;
};

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

/** `2026-10-16` in local time — the format a date input uses. */
export function toLocalIsoDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `dd/mm/yyyy` → its { day, month, year } strings, or null when not in that shape. */
export function splitDayMonthYear(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? '');
  return match ? { day: match[1], month: match[2], year: match[3] } : null;
}

/* Strict dd/mm/yyyy → Date, or null when it isn't a real calendar day. The
   round-trip check is what rejects rollovers like 31/02/2000, which `new Date`
   would otherwise hand back as the 2nd of March. */
export function parseDayMonthYear(value) {
  const parts = splitDayMonthYear(value);
  if (!parts) return null;

  const day = +parts.day;
  const month = +parts.month;
  const year = +parts.year;
  const date = new Date(year, month - 1, day);

  const real =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return real ? date : null;
}

/** `19/10/2026` → `2026-10-19`; empty when not dd/mm/yyyy. */
export function dmyToIso(value) {
  const parts = splitDayMonthYear(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : '';
}

/** `2026-10-19` → `19/10/2026`; empty when not yyyy-mm-dd. */
export function isoToDmy(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
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
