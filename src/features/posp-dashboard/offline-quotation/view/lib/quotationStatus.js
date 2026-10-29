// Status pill styles and the status filter list. Each row carries its own label and
// colour, but the server never sends the full list of states, so the filter list is kept here.

import { humaniseCode } from '@/features/posp-dashboard/offline-quotation/lib/normalize';

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

// The text colour is darkened until its luminance is at most this (about 4.5:1 contrast).
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

/** Fallback styles when the colour is missing or malformed. */
const NEUTRAL = Object.freeze({
  color: 'var(--color-on-surface-variant)',
  backgroundColor: 'var(--color-surface-container)',
  boxShadow: 'inset 0 0 0 1px var(--color-outline-variant)',
});

/** Inline styles for a status pill from the server's hex colour. */
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

/** What to print on the pill: the server's label as sent, or `—`. */
export const statusLabel = ({ statusLabel: label } = {}) => label || '—';

/* ── The toolbar's vocabulary ──────────────────────────────────────────── */

/** The "no status filter" chip. Sends no `status` parameter at all. */
export const ALL = 'ALL';

const RESPONSES_RECEIVED = 'RESPONSES_RECEIVED';

/**
 * Whether to fetch insurer responses (`compare` returns an empty list, not 404, when there are none).
 * ⚠ Confirm with backend whether later states (bound, issued, rejected) keep responses readable.
 */
export const hasInsurerResponses = (statusCode) => statusCode === RESPONSES_RECEIVED;

/**
 * Status codes seen in real replies. Add one only when the backend confirms it or it is
 * seen live; other codes are learned from loaded rows (see `mergeStatuses`).
 */
export const SEEN_STATUSES = [
  { code: 'DRAFT', label: 'Draft' },
  { code: 'SENT_TO_INSURER', label: 'Sent to Insurer' },
  { code: RESPONSES_RECEIVED, label: 'Responses Received' },
];

/** Known statuses plus any new ones found on loaded rows; the row's label wins. */
export const mergeStatuses = (known = SEEN_STATUSES, rows = []) => {
  const byCode = new Map(known.map((entry) => [entry.code, entry.label]));
  const before = byCode.size;

  for (const row of rows) {
    if (!row?.statusCode) continue;
    // Use a readable form of the code when the row has no label.
    byCode.set(row.statusCode, row.statusLabel || humaniseCode(row.statusCode));
  }

  // Return the same array when nothing new was found, so callers holding it in state don't re-render.
  if (byCode.size === before) return known;

  return [...byCode].map(([code, label]) => ({ code, label }));
};

/* ── Remembered colours ────────────────────────────────────────────────── */

/**
 * Status colours remembered from queue rows, because `GET /quote/<id>` has no `colorHex`.
 * ⚠ Ask the backend to send `colorHex` on the detail reply; then remove this cache.
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

const SUBMITTABLE = ['DRAFT'];

/** Whether to offer "Submit for verification" on a quote in this state. */
export const canApplyForVerification = (statusCode) => SUBMITTABLE.includes(statusCode);

/* ── Correcting a returned quote ───────────────────────────────────────── */

/**
 * States in which the agent may edit the answers: a draft or a quote sent back by review.
 * ⚠ `RETURNED_FOR_CORRECTION` is inferred from the pill label, not seen in a reply.
 */
const EDITABLE = ['DRAFT', 'RETURNED_FOR_CORRECTION'];

/** Whether to offer "Edit" on a quote in this state. */
export const canEditQuote = (statusCode) => EDITABLE.includes(statusCode);

/* ── Payment instruction ───────────────────────────────────────────────── */

/** The state in which the RM's payment instruction is fetched and offered. */
const PROPOSAL_CREATED = 'PROPOSAL_CREATED';

/** Whether to ask for this quote's payment instruction at all. */
export const hasPaymentInstruction = (statusCode) => statusCode === PROPOSAL_CREATED;
