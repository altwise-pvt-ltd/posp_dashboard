/**
 * Turning a `/posp/me` record into the strings the profile cards print.
 *
 * Every function here returns `null` rather than a placeholder when it has
 * nothing to show, and every card treats `null` as "drop the row". That is the
 * rule the whole screen is built on: these cards used to print a fictional
 * POSP — a name, a PAN, a bank account and a set of ticked KYC boxes that
 * belonged to nobody — and the failure mode to design against is not an empty
 * field, it is a convincing one. A missing row is obviously missing; a
 * plausible default is indistinguishable from the truth.
 */

import { VERIFICATION } from '@/shared/store/verificationStore';

/* ── Dates ─────────────────────────────────────────────────────────────── */

const at = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  /* Rejects the impossible ones JS would roll forward instead — 31/02 becomes
     3 March rather than an error, and a birth date that quietly moves is worse
     than one that doesn't render. */
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
};

/**
 * The date fields arrive in more than one dialect, so the shape is sniffed
 * rather than assumed: the onboarding PAN step sends `yyyy/MM/dd`, the form the
 * user types is `dd/mm/yyyy`, and an ISO stamp turns up on the training record.
 *
 * Deliberately not `new Date(text)` alone — that reads `01/02/2024` as 2 January
 * under US rules, silently swapping day and month for the first twelve days of
 * every month. The explicit patterns run first and only unrecognised input
 * falls through to the built-in parser.
 */
export function parseApiDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const text = String(value).trim();
  if (!text) return null;

  const ymd = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(text);
  if (ymd) return at(+ymd[1], +ymd[2], +ymd[3]);

  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(text);
  if (dmy) return at(+dmy[3], +dmy[2], +dmy[1]);

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** `22 August 1990`, or null when the value isn't a date we understand. */
export function formatLongDate(value) {
  const date = parseApiDate(value);
  return date ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : null;
}

/* ── Masking ───────────────────────────────────────────────────────────── */

/**
 * Has the server already hidden this for us?
 *
 * Anything that isn't a digit or a space — an `X`, a bullet, an asterisk — means
 * the value arrived masked, and re-masking it would eat the four digits the
 * mask deliberately left visible.
 */
const alreadyMasked = (text) => /[^\d\s]/.test(text);

const tail = (text, count = 4) => {
  const digits = text.replace(/\D/g, '');
  return digits.length >= count ? digits.slice(-count) : null;
};

/** `XXXX XXXX 4521`. */
export function maskAadhaar(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (alreadyMasked(text)) return text;

  const last = tail(text);
  return last ? `XXXX XXXX ${last}` : null;
}

/** `••••3210`. */
export function maskAccount(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (alreadyMasked(text)) return text;

  const last = tail(text);
  return last ? `••••${last}` : null;
}

/**
 * `ABCDE••••F` — the four-digit block hidden, the alpha bookends kept.
 *
 * Only rewrites a value that is unmistakably a full PAN. Anything else is
 * passed through as sent: it is either already masked or something this app
 * doesn't recognise, and both are cases where guessing at the shape would
 * mangle it.
 */
export function maskPan(value) {
  const text = String(value ?? '').trim().toUpperCase();
  if (!text) return null;
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(text)) return text;

  return `${text.slice(0, 5)}••••${text.slice(9)}`;
}

/* ── Contact ───────────────────────────────────────────────────────────── */

/** `+91 98220 11456` for a ten-digit number; anything else is left alone. */
export function formatMobile(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;

  const digits = text.replace(/\D/g, '');
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : text;
}

/** What goes in a `tel:` href — digits only, so the dialler doesn't choke. */
export function telHref(value) {
  const digits = String(value ?? '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

/* ── Composition ───────────────────────────────────────────────────────── */

const clean = (value) => {
  const text = String(value ?? '').trim();
  return text || null;
};

/**
 * The three address lines, the city, the state and the PIN as one line.
 *
 * Built from whatever is present rather than from a fixed template — a POSP who
 * left address line 2 blank should not get a stray comma where it would have
 * gone.
 */
export function composeAddress(profile) {
  const street = [profile?.address1, profile?.address2, profile?.address3]
    .map(clean)
    .filter(Boolean)
    .join(', ');

  const region = [profile?.city, profile?.state].map(clean).filter(Boolean).join(', ');
  const pin = clean(profile?.pincode);
  const place = [region, pin].filter(Boolean).join(' – ');

  return [street, place].filter(Boolean).join(', ') || null;
}

/** `RP` — for the avatar frame when there is no photograph on file. */
export function initials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';

  const first = parts[0][0];
  const last = parts.length > 1 ? parts.at(-1)[0] : '';
  return `${first}${last}`.toUpperCase();
}

/* ── Verdict ───────────────────────────────────────────────────────────── */

/**
 * How the three-way verdict is worded and coloured.
 *
 * `verification` is derived in `pospApi.deriveVerification` and is the only
 * thing on this screen allowed to say whether a POSP is cleared. The cards
 * never decide it for themselves — the old KYC card printed "Verified" as a
 * literal on four hardcoded rows, which is the exact claim this app has no
 * business making on its own.
 */
export const VERDICT = {
  [VERIFICATION.VERIFIED]: { label: 'Verified', pill: 'text-emerald-600 bg-emerald-50' },
  [VERIFICATION.REJECTED]: { label: 'Sent back', pill: 'text-rose-600 bg-rose-50' },
  [VERIFICATION.PENDING]: { label: 'In review', pill: 'text-amber-600 bg-amber-50' },
};

export const verdictOf = (profile) =>
  VERDICT[profile?.verification] ?? VERDICT[VERIFICATION.PENDING];
