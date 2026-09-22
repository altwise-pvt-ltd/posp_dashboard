/**
 * The status vocabulary a policy row renders, in one place.
 *
 * Whole-word keys and an explicit table, the same discipline as
 * `shared/status/pospStatus.js` and `offline-quotation/view/lib/quotationStatus.js`
 * — an unknown status from the server falls back to a neutral pill rather than
 * being pattern-matched into the wrong one.
 *
 * ⚠ Provisional. There is no policy endpoint yet (see `data/mockPolicies.js`),
 * so these four are the states a general-insurance book actually distinguishes.
 * Reconcile with the backend's vocabulary the day the endpoint exists; that is
 * a change to this table and nothing else.
 *
 * Note what is deliberately NOT here: "expiring soon". That is not a state a
 * server stores, it is `endDate` minus today, and putting it in this table
 * would mean a row whose pill goes stale on a date boundary and a value the
 * backend will never send. It lives in `policyFilters.js` as a derived flag
 * with its own visual treatment, so it can sit *beside* a status rather than
 * competing with one — an expiring policy is still ACTIVE, and the agent needs
 * to see both facts.
 */

export const POLICY_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  LAPSED: 'LAPSED',
};

/**
 * `pill` is the full class string rather than a colour name the components map
 * again — one lookup, and the palette for a state lives next to its label.
 *
 * ACTIVE is emerald and not the brand orange: colour is carrying meaning in
 * this table, and orange is reserved here for the expiring-soon treatment,
 * which is the one thing on the screen that wants the agent to act.
 *
 * CANCELLED and LAPSED are both "no longer in force" and are still two pills:
 * one is a decision someone made, the other is a premium nobody paid, and only
 * the second is worth a phone call.
 */
const STATUS_TABLE = {
  [POLICY_STATUS.ACTIVE]: {
    label: 'Active',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  [POLICY_STATUS.EXPIRED]: {
    label: 'Expired',
    pill: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
  [POLICY_STATUS.LAPSED]: {
    label: 'Lapsed',
    pill: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
  [POLICY_STATUS.CANCELLED]: {
    label: 'Cancelled',
    pill: 'bg-slate-100 text-slate-500 ring-slate-200',
  },
};

const UNKNOWN = { label: 'Unknown', pill: 'bg-slate-100 text-slate-500 ring-slate-200' };

const normalise = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

export const statusMeta = (value) => STATUS_TABLE[normalise(value)] ?? UNKNOWN;

/** Filter order in the toolbar. Lifecycle order, not alphabetical. */
export const STATUS_ORDER = [
  POLICY_STATUS.ACTIVE,
  POLICY_STATUS.EXPIRED,
  POLICY_STATUS.LAPSED,
  POLICY_STATUS.CANCELLED,
];
