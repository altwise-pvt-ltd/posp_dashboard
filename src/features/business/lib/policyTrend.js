/**
 * Premium booked per month, derived from the policy rows themselves.
 *
 * The same discipline as the summary strip: the chart is computed from the
 * list's own records, so it cannot disagree with the table underneath it and
 * needs no endpoint of its own. Feed it the rows, get the bars.
 *
 * This lives in the Business module because Business owns policy data, and it
 * is exported rather than kept private because Overview's chart reads it too —
 * one aggregation, so the dashboard's two views of "how much have I sold" can
 * never tell different stories.
 */

/** A month bucket's key. Local time, because the agent's month is their own. */
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * How many months the trend covers, current month included.
 *
 * Twelve, so the chart spans a full renewal cycle: general insurance is an
 * annual product, and a window shorter than a year would cut the comparison
 * that matters — this March against last March.
 */
export const TREND_MONTHS = 12;

/**
 * Every policy issued in the window, bucketed by issue month.
 *
 * ── What counts ───────────────────────────────────────────────────────────
 *
 * Every row, whatever its status today — a policy that has since lapsed was
 * still business written that month, and removing it would rewrite history
 * each time a customer stopped paying. This is also exactly the rule the
 * "Premium booked" summary tile uses, and the two figures are on screen
 * together: the tile is the book's whole life, the chart its last twelve
 * months, and a reader must be able to reconcile them. One rule, both places.
 *
 * ── Why the months are generated, not collected ───────────────────────────
 *
 * The window is built first and then filled, so a month in which nothing was
 * sold is a labelled zero-height bar rather than a missing column. Collecting
 * only the months that have rows silently closes the gaps, and a quiet April
 * then reads as April never happening — the chart's most useful signal turned
 * into its most invisible one.
 */
export function monthlyPremium(policies = [], now = new Date(), months = TREND_MONTHS) {
  const buckets = new Map();

  // Oldest first, so the array reads left to right like the chart draws.
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    buckets.set(monthKey(d), {
      key: monthKey(d),
      date: d,
      // 'Sep' — the axis tick. Short, because twelve of them share the width.
      //
      // Trimmed to three characters rather than taken as the locale gives it:
      // en-IN (and en-GB) abbreviate September to 'Sept', so one tick in
      // twelve comes back a character wider than the rest and that column's
      // label sits visibly off-centre under its bar. Every other month is
      // already three letters, so the slice only ever touches that one.
      label: d.toLocaleDateString('en-IN', { month: 'short' }).replace('.', '').slice(0, 3),
      // 'September 2026' — for the tooltip and the accessible table, where
      // there is room to be unambiguous about which September.
      fullLabel: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      premium: 0,
      count: 0,
      isCurrent: i === 0,
    });
  }

  for (const policy of policies) {
    if (!policy?.issuedAt) continue;

    const issued = new Date(policy.issuedAt);
    if (Number.isNaN(issued.getTime())) continue;

    const bucket = buckets.get(monthKey(issued));
    // Older than the window, or somehow in the future — not this chart's
    // business. The list still shows it; see the fixture's last three rows.
    if (!bucket) continue;

    bucket.premium += Number.isFinite(policy.premium) ? policy.premium : 0;
    bucket.count += 1;
  }

  return [...buckets.values()];
}

/**
 * Round a peak up to a number an axis can be ticked at.
 *
 * The axis is divided into four, and a scale taken straight from the tallest
 * bar gives ticks like ₹88,300 / ₹66,225 / ₹44,150 — arithmetically correct
 * and unreadable, because nobody holds a quarter of eighty-eight thousand
 * three hundred in their head. Rounding the top of the scale up to a clean
 * number makes all four ticks clean at once.
 *
 * The multipliers are the ones that still divide by four sensibly, so the
 * intermediate ticks land somewhere tidy too: 88,300 becomes ₹1L ticked every
 * ₹25,000, and 5.8L becomes ₹8L ticked every ₹2L. The cost is a little
 * headroom above the tallest bar, which is what stops a peak from touching the
 * top of the plot anyway.
 */
export function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1;

  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = [1, 2, 4, 5, 8, 10].find((s) => n <= s) ?? 10;

  return step * pow;
}

/**
 * The trend plus the few numbers drawn beside it.
 *
 * `max` is what every bar's height is a fraction of. It is floored at 1 so a
 * window with no business at all divides by one rather than by zero and
 * renders twelve flat bars instead of twelve `NaN%` heights.
 *
 * `best` is the one bar worth direct-labelling. The mark specs are explicit
 * that labelling every column is noise, so the chart labels the extreme and
 * the current month and lets the tooltip carry the rest.
 *
 * `window` is how many months to cover. Business asks for twelve — a full
 * renewal cycle. Overview asks for six, because it is a summary that links
 * through rather than the place the question gets answered. Same rows, same
 * rule, two lengths: the figures agree wherever the two windows overlap,
 * which they could not if each page aggregated for itself.
 */
export function buildTrend(policies = [], now = new Date(), window = TREND_MONTHS) {
  const months = monthlyPremium(policies, now, window);

  const max = Math.max(1, ...months.map((m) => m.premium));
  const total = months.reduce((sum, m) => sum + m.premium, 0);
  const count = months.reduce((sum, m) => sum + m.count, 0);
  const current = months[months.length - 1];

  // Ties go to the earlier month — `>` rather than `>=` — so a flat window
  // marks its first month once instead of moving the flag to the last.
  const best = months.reduce(
    (top, m) => (m.premium > top.premium ? m : top),
    months[0]
  );

  return {
    months,
    /** The tallest bar's actual premium — what "best month" is worth. */
    max,
    /** What the y-axis runs to, and therefore what bar heights are a fraction
        of. Always >= `max`, and always a number worth printing on a tick. */
    scaleMax: niceMax(max),
    total,
    count,
    current,
    // A window with nothing in it has no "best month" to point at, and a flag
    // over an empty chart is worse than no flag.
    best: best && best.premium > 0 ? best : null,
    /** Nothing was written in the whole window — the chart's own empty state. */
    isEmpty: total === 0,
  };
}
