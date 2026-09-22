import AppLink from '@/shared/components/AppLink';
import PolicyTrend from '@/features/business/components/PolicyTrend';
import { usePolicyTrend } from '@/features/business/hooks/usePolicyTrend';

/**
 * Overview's sales chart — the last six months of premium booked, linking
 * through to the full twelve on My Business.
 *
 * ── What this used to be, and why none of it survived ─────────────────────
 *
 * A hand-written dataset of six months, with a Self/Team toggle, bars stacked
 * by product, and a fixed "AI INSIGHT" paragraph. Every figure in it was
 * invented. Now that `/business` derives the same measure from real policy
 * rows, leaving this as it was would have put two sales charts in one
 * dashboard quoting different numbers for the same months — so it reads the
 * same aggregation, and the pieces that could not survive that went:
 *
 * • **The dual axis.** It plotted rupees against a left scale and case counts
 *   against a right one. Where two y-scales share a plot the alignment between
 *   them is arbitrary, so the chart asserts a correlation that is not in the
 *   data — and feeding real numbers into that shape would have laundered the
 *   problem rather than fixed it. One measure, one axis. The policy count now
 *   rides the tooltip and the table.
 *
 * • **Self / Team.** Team cannot be derived from this agent's own policies,
 *   and a toggle where one side is real and the other is invented is worse
 *   than no toggle — it makes the fabricated half look as trustworthy as the
 *   measured one. It comes back when a team endpoint exists.
 *
 * • **The product stack.** A different question ("what do I sell?") from the
 *   one this chart answers ("how much am I writing, and when?"), and it needs
 *   a validated categorical palette to do honestly. Worth its own chart.
 *
 * • **The "AI INSIGHT" paragraph.** It claimed March was the best month on a
 *   40% rise in Health — a sentence no model wrote and no data supported. The
 *   highlight below is computed from the rows, so it is simply true, and it is
 *   not labelled as AI because nothing about a `max()` is.
 *
 * What is left is a thin wrapper: the data comes from the Business module, and
 * so does the chart. This file exists to choose the window and say where the
 * card links to.
 */

/** Six, not twelve. A summary that links through, not the answer itself. */
const OVERVIEW_MONTHS = 6;

function MonthlySalesChart() {
  const { trend } = usePolicyTrend(OVERVIEW_MONTHS);

  return (
    <div className="anim-fade-d4">
      <PolicyTrend
        trend={trend}
        title="Monthly Sales"
        action={
          <AppLink
            to="/business"
            className="font-data-mono text-data-mono mt-1 inline-flex items-center gap-1 text-primary hover:underline"
          >
            View all <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
          </AppLink>
        }
      />

      {/* The highlight, derived. Rendered only when there is a peak to point
          at — over an empty window the sentence would have no subject, and a
          card explaining that nothing happened is worse than no card. */}
      {trend.best && (
        <div className="mt-gutter flex items-start gap-4 rounded-xl border border-gray-200 bg-linear-to-r from-violet-50 to-sky-50 p-4 sm:gap-gutter sm:p-gutter">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <span className="material-symbols-outlined text-[20px] text-violet-600">
              auto_awesome
            </span>
          </div>
          <div className="flex-1">
            <p className="font-label-caps text-label-caps mb-1 text-violet-600">HIGHLIGHT</p>
            <p className="font-body-md text-body-md text-on-surface">
              <span className="font-semibold">{trend.best.fullLabel}</span> was your strongest
              month in this window — {trend.best.count}{' '}
              {trend.best.count === 1 ? 'policy' : 'policies'} written. Worth revisiting the
              leads from that period as their renewals come round.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonthlySalesChart;
