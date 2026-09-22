/**
 * The derived facts about a policy — the ones no server field answers — plus
 * the comparators the list sorts by.
 *
 * Kept apart from `policyStatus.js` on purpose. That file is a lookup table
 * that will one day be reconciled with the backend's own vocabulary; this file
 * is logic that stays true whatever the backend calls things.
 */

import { daysUntil } from '@/shared/lib/format';

/**
 * How far ahead "expiring soon" looks.
 *
 * 30 days because that is roughly the window an agent can still act in: a
 * motor or health renewal quoted inside a month is one the customer has not
 * yet taken elsewhere. Exported rather than inlined so the chip label, the row
 * treatment and the summary tile cannot drift apart into three windows.
 */
export const EXPIRY_WINDOW_DAYS = 30;

/**
 * True when the policy is in force and runs out inside the window.
 *
 * The `ACTIVE` check is load-bearing, not belt-and-braces: without it every
 * expired policy in the book also "expires within 30 days" for the month after
 * it lapses, and the chip that should be a short worklist becomes the archive.
 *
 * `days >= 0` excludes today's own expiry date being read as already gone,
 * and a null date (no end recorded) is never soon — `daysUntil` returns null
 * and the comparison is false rather than throwing.
 */
export function isExpiringSoon(policy, from = new Date()) {
  if (policy?.status !== 'ACTIVE') return false;

  const days = daysUntil(policy?.endDate, from);
  return days !== null && days >= 0 && days <= EXPIRY_WINDOW_DAYS;
}

/**
 * "in 12 days" / "today" / "tomorrow" — the expiry phrased the way it gets
 * said, for the row treatment and the detail drawer.
 *
 * Returns null when there is nothing urgent to say, so callers render nothing
 * rather than an empty element.
 */
export function expiryLabel(policy, from = new Date()) {
  if (!isExpiringSoon(policy, from)) return null;

  const days = daysUntil(policy.endDate, from);
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';

  return `Expires in ${days} days`;
}

/**
 * The two orders this list is genuinely read in.
 *
 * `recent` is the default — the same reasoning as the quotations list, an
 * agent scanning for what they just did. `expiry` is the renewal worklist,
 * and it is the reason a sort control exists here at all when the quotations
 * screen needed none.
 *
 * ── Why `expiry` is not just `endDate` ascending ───────────────────────────
 *
 * Because a plain ascending sort opens the renewal worklist on the policy that
 * ran out six months ago. Every expired, lapsed and cancelled row has an older
 * end date than every upcoming one, so they all sort above the work — the exact
 * inversion of what the control is for.
 *
 * So rows are banded first, then ordered inside their band:
 *
 *   0  still to come  — ascending, soonest first. The worklist.
 *   1  already ended  — descending, most recently ended first. Still useful
 *                       (a renewal a fortnight late is worth a call; one from
 *                       last year is not), just never above live business.
 *   2  no end date    — last. A missing date is not an imminent one, and
 *                       `new Date(null)` is the epoch, which would otherwise
 *                       park these at the very top.
 */
const endBand = (policy, from) => {
  if (!policy.endDate) return { band: 2, time: 0 };

  const time = new Date(policy.endDate).getTime();
  if (Number.isNaN(time)) return { band: 2, time: 0 };

  // Compared against the start of today, not `now`: a policy ending today is
  // still to come until the day is over, which is also what `daysUntil` says.
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();

  return time >= startOfToday ? { band: 0, time } : { band: 1, time: -time };
};

/**
 * Both are comparator *factories* taking the clock, not comparators.
 *
 * `expiry` needs to know what "today" is, and a comparator that called
 * `new Date()` itself would build one per comparison — n log n of them — and
 * could read two different days either side of midnight, which is how a sort
 * ends up non-transitive and throws. Binding the caller's single `now` once
 * fixes both, and `recent` takes the same shape so the call site is uniform.
 */
export const SORT = {
  recent: {
    label: 'Newest first',
    compare: () => (a, b) => new Date(b.issuedAt ?? 0) - new Date(a.issuedAt ?? 0),
  },
  expiry: {
    label: 'Expiring first',
    compare: (from) => (a, b) => {
      const left = endBand(a, from);
      const right = endBand(b, from);

      return left.band - right.band || left.time - right.time;
    },
  },
};

export const SORT_ORDER = ['recent', 'expiry'];

/**
 * Policy number, customer name, mobile, product and insurer — what an agent
 * has to hand when they come looking. Matched as a substring on a lowercased
 * haystack, so "9822" finds a number and "priv" finds Private Car.
 */
export function matchesQuery(policy, query) {
  if (!query) return true;

  const haystack = [
    policy.policyNumber,
    policy.customerName,
    policy.customerMobile,
    policy.product,
    policy.subProduct,
    policy.insurer,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}
