/**
 * The status vocabulary the quotation list renders, in one place.
 *
 * Whole-word keys and an explicit table, the same discipline as
 * `shared/status/pospStatus.js` — an unknown status from the server falls back
 * to a neutral pill rather than being pattern-matched into the wrong one.
 *
 * ⚠ Provisional. There is no list endpoint yet (see `data/mockQuotations.js`),
 * so these four are the states the create flow implies — a saved draft, a quote
 * given to the customer, one that turned into a policy, and one whose validity
 * ran out. Reconcile with the backend's own vocabulary the day `GET /quote/...`
 * exists; that is a change to this table and nothing else.
 */

export const QUOTE_STATUS = {
  DRAFT: 'DRAFT',
  QUOTED: 'QUOTED',
  CONVERTED: 'CONVERTED',
  EXPIRED: 'EXPIRED',
};

/**
 * `pill` is the full class string rather than a colour name the components map
 * again — one lookup, and the palette for a state lives next to its label.
 *
 * Green and rose appear here and essentially nowhere else in the dashboard on
 * purpose: colour is carrying meaning in this table, so the warm brand ramp is
 * reserved for the one state that is genuinely "in progress with us".
 */
const STATUS_TABLE = {
  [QUOTE_STATUS.DRAFT]: {
    label: 'Draft',
    pill: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
  [QUOTE_STATUS.QUOTED]: {
    label: 'Quoted',
    pill: 'bg-orange-50 text-orange-700 ring-orange-100',
  },
  [QUOTE_STATUS.CONVERTED]: {
    label: 'Converted',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  [QUOTE_STATUS.EXPIRED]: {
    label: 'Expired',
    pill: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
};

const UNKNOWN = { label: 'Unknown', pill: 'bg-slate-100 text-slate-500 ring-slate-200' };

const normalise = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

export const statusMeta = (value) => STATUS_TABLE[normalise(value)] ?? UNKNOWN;

/** Filter order in the toolbar. Deliberately the lifecycle order, not alphabetical. */
export const STATUS_ORDER = [
  QUOTE_STATUS.DRAFT,
  QUOTE_STATUS.QUOTED,
  QUOTE_STATUS.CONVERTED,
  QUOTE_STATUS.EXPIRED,
];
