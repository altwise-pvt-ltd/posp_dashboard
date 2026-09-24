/**
 * How a quote's status is drawn, and which statuses the toolbar offers.
 *
 * The status table this module used to hold is gone: `/quote/queue/mine` sends
 * the label (`status: "Draft"`) and the colour (`colorHex: "#9AA3B2"`) with
 * every row, so the app no longer decides either. A state added on the server
 * now renders correctly here without a deploy, which a hardcoded table could
 * never manage — it would have rendered the new state as "Unknown".
 *
 * What the server does *not* send is the list of states that exist, because a
 * page only ever describes the rows on it. So the filter vocabulary below is
 * still a constant, and still provisional.
 */

/* ── The pill's colours ────────────────────────────────────────────────── */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `#9AA3B2` or `#9AB` → `{ r, g, b }`; null for anything else. */
const parseHex = (value) => {
  const match = HEX.exec(typeof value === 'string' ? value.trim() : '');
  if (!match) return null;

  const hex =
    match[1].length === 3
      ? match[1]
          .split('')
          .map((char) => char + char)
          .join('')
      : match[1];

  const int = Number.parseInt(hex, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

/** sRGB relative luminance, per WCAG. */
const channel = (value) => {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = ({ r, g, b }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/**
 * The darkest the *text* may be allowed to get away with.
 *
 * 0.18 against a near-white pill is (1.0 + 0.05) / (0.18 + 0.05) ≈ 4.5:1, which
 * is WCAG AA for body text.
 *
 * This exists because the server's colours are chosen to be *seen*, not to be
 * read off: `#9AA3B2` on its own 12% tint is about 2:1, which is a light grey
 * word on a lighter grey lozenge. So the hue the server picked is kept and its
 * lightness is pulled down until the word is legible — the pill still reads as
 * that status' colour, and the label can actually be read.
 */
const INK_LUMINANCE = 0.18;

const ink = (rgb) => {
  let { r, g, b } = rgb;

  for (let guard = 0; guard < 24 && luminance({ r, g, b }) > INK_LUMINANCE; guard += 1) {
    r *= 0.88;
    g *= 0.88;
    b *= 0.88;
  }

  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
};

/**
 * The neutral pill, for a row that arrived with no colour or a malformed one.
 *
 * Built from the theme's own tokens rather than literal greys. This is the one
 * pill the server did *not* colour, so it is the one that should look like it
 * belongs to the app — and the app's surface ramp is warm (`#876658` on
 * `#f4f4f4`), not the cool slate a hardcoded fallback would reach for.
 */
const NEUTRAL = Object.freeze({
  color: 'var(--color-on-surface-variant)',
  backgroundColor: 'var(--color-surface-container)',
  boxShadow: 'inset 0 0 0 1px var(--color-outline-variant)',
});

/**
 * Inline styles for one status pill, from the server's hex.
 *
 * Inline rather than classes because the value arrives at runtime — Tailwind
 * cannot generate a class for a colour it has never seen, and the alternative
 * (a map from hex to class) puts the app back in charge of the palette, which
 * is the thing this module just stopped doing.
 *
 * `boxShadow` and not a border: the pill sits in table cells whose height is
 * set by the text beside it, and an inset shadow draws the outline without
 * adding a pixel to the box.
 */
export const statusStyle = (colorHex) => {
  const rgb = parseHex(colorHex);
  if (!rgb) return NEUTRAL;

  const { r, g, b } = rgb;

  return {
    color: ink(rgb),
    backgroundColor: `rgb(${r} ${g} ${b} / 0.12)`,
    boxShadow: `inset 0 0 0 1px rgb(${r} ${g} ${b} / 0.35)`,
  };
};

/**
 * What to print on the pill.
 *
 * The server's label first. Failing that the code, made readable — a row with a
 * `statusCode` and no `status` is still telling us what it is, and "DRAFT" set
 * in caps beside four sentence-case pills is worse than "Draft".
 *
 * Underscores become spaces and each word is capitalised, so `IN_REVIEW` reads
 * "In Review" rather than "In_review". Codes are SCREAMING_SNAKE by convention
 * and a single-word one loses nothing by going through the same path.
 */
export const statusLabel = ({ statusLabel: label, statusCode } = {}) => {
  if (label) return label;
  if (!statusCode) return 'Unknown';

  return statusCode
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

/* ── The toolbar's vocabulary ──────────────────────────────────────────── */

/** The "no status filter" chip. Sends no `status` parameter at all. */
export const ALL = 'ALL';

/**
 * Status codes seen from the server, verbatim.
 *
 * ⚠ Not a guess, and deliberately short. An earlier version of this list held
 * four invented codes (QUOTED / CONVERTED / EXPIRED) carried over from the
 * mock; `SENT_TO_INSURER` turned up on the very first real quote and none of
 * those three did. Since a chip is now a live `?status=` request, an invented
 * code is a request for a state that may not exist — so only what has actually
 * been observed is seeded here, and the rest is learned (see `mergeStatuses`).
 *
 * Add to this only when the backend confirms a code, or when one is seen in a
 * reply. It is a floor, not a ceiling.
 */
export const SEEN_STATUSES = [
  { code: 'DRAFT', label: 'Draft' },
  { code: 'SENT_TO_INSURER', label: 'Sent to Insurer' },
];

/**
 * The chips to offer: the codes above, plus every other status the loaded rows
 * turned out to carry.
 *
 * Learned rather than declared, because the server never sends the vocabulary —
 * a page only describes the rows on it. The union is what keeps that honest in
 * both directions: a state nobody has quoted yet still gets a chip (so the
 * filter is useful on an empty queue), and a state this app has never heard of
 * gets one the moment it appears (so it is reachable without a deploy).
 *
 * Wording from the row wins over the constant — the server's own label for a
 * state is the one the pills are already using.
 */
export const mergeStatuses = (known = SEEN_STATUSES, rows = []) => {
  const byCode = new Map(known.map((entry) => [entry.code, entry.label]));
  const before = byCode.size;

  for (const row of rows) {
    if (!row?.statusCode) continue;
    byCode.set(row.statusCode, row.statusLabel || statusLabel(row));
  }

  // Same identity back when nothing was learned. The caller holds this in state
  // and a fresh array every page would re-render the toolbar on every fetch.
  if (byCode.size === before) return known;

  return [...byCode].map(([code, label]) => ({ code, label }));
};

/* ── Remembered colours ────────────────────────────────────────────────── */

/**
 * What the queue said each status looks like.
 *
 * `GET /quote/queue/mine` sends `colorHex` on every row; `GET /quote/<id>` does
 * not. Without this, the same quote wears a coloured pill in the list and a
 * grey one on the page that list opens — the kind of inconsistency that reads
 * as a bug in the status itself.
 *
 * Module-level and deliberately not React state: it is a cache of something the
 * server told us, not something the UI owns, and nothing needs to re-render
 * when it fills. A deep link opened without visiting the list finds it empty
 * and falls back to the neutral pill, which is the correct answer for a colour
 * we have genuinely never been told.
 *
 * ⚠ Ask the backend to send `colorHex` on the detail reply too; this whole
 * mechanism then becomes unnecessary and should be deleted.
 */
const PALETTE = new Map();

/** Called by `normalizeRow` for every queue row that arrives. */
export const rememberStatusColor = (statusCode, colorHex) => {
  if (statusCode && colorHex) PALETTE.set(statusCode, colorHex);
};

/** The remembered colour for a status, or null if the queue never said. */
export const recallStatusColor = (statusCode) =>
  (statusCode && PALETTE.get(statusCode)) || null;

/* ── Applying for verification ─────────────────────────────────────────── */

/**
 * The states a quote may be submitted for verification from.
 *
 * `DRAFT` and only `DRAFT`. This was a deny-list — "anything not already past
 * verification" — which was the right shape while the lifecycle was unknown but
 * the wrong answer now that it isn't: it would offer the button on a quote
 * already with the insurer, or on one returned for correction, where the action
 * is to edit and re-submit rather than to submit again.
 *
 * An allow-list is only safe because this is a stated rule rather than an
 * inference. A state added server-side will not get the button until it is
 * named here, which is the correct trade once the rule is known — the risk now
 * runs the other way, towards offering an action the back office would reject.
 */
const SUBMITTABLE = ['DRAFT'];

/** Whether to offer "Submit for verification" on a quote in this state. */
export const canApplyForVerification = (statusCode) => SUBMITTABLE.includes(statusCode);
