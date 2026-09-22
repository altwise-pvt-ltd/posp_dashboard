import { useId } from 'react';
import { formatCompactCurrency, formatCurrency } from '@/shared/lib/format';

/**
 * Premium booked per month, drawn from the same rows the list and the summary
 * strip use.
 *
 * ── The form ──────────────────────────────────────────────────────────────
 *
 * One measure, one axis, one column per month. Deliberately *not* the shape of
 * `overview/components/MonthlySalesChart`, which plots rupees against a left
 * axis and case counts against a right one: two y-scales on a single plot make
 * the alignment between the two series arbitrary, so the chart implies a
 * correlation that is not in the data. Premium and policy count are different
 * magnitudes and belong on different charts — here the count rides the
 * tooltip and the table instead.
 *
 * ── Colour ────────────────────────────────────────────────────────────────
 *
 * Emphasis, not identity: every month is the same series, so there is one mark
 * colour and the current month is picked out in the brand accent. That also
 * means no legend — a single series is named by the heading above it, and a
 * one-swatch legend box would only restate it.
 *
 * The two fills sit at 2.9:1 and 2.4:1 against white, under the 3:1 a mark
 * wants. That is allowed only with relief, and the relief is real rather than
 * nominal: the peak and current columns carry their values directly, the axis
 * is labelled, every column answers hover *and* keyboard focus, and the whole
 * series is available as a table below. No value here is reachable only by
 * colour, and none is reachable only by pointing at it.
 *
 * ── What is not here ──────────────────────────────────────────────────────
 *
 * No product split. Stacking four segments per column would put the categorical
 * palette back in play and answer a different question ("what do I sell?")
 * than this one ("how much am I writing, and when?"). Worth its own chart if
 * someone wants it; not worth overloading this one.
 *
 * ── Two callers ───────────────────────────────────────────────────────────
 *
 * Business renders it over twelve months; Overview over six, with a link
 * through. The window is whatever `trend` was built with — read off
 * `months.length` rather than the module's default, or the six-month card
 * would caption itself "last 12 months" — and `action` is where the caller
 * puts a link. Nothing else differs, which is the point: one chart, so the
 * two pages cannot render the same months two different ways.
 */

/** Four gridlines and a baseline — the fractions the y-axis is ticked at. */
const TICKS = [1, 0.75, 0.5, 0.25, 0];

function PolicyTrend({ trend, title = 'Premium booked', action = null, className = '' }) {
  const tableId = useId();
  const { months, scaleMax, total, count, current, best, isEmpty } = trend;

  /* The window the caller actually asked for, not the module default.
     Named `monthCount` and not `window`: shadowing the DOM global inside a
     component is legal right up until something in here needs it. */
  const monthCount = months.length;

  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-4 sm:p-gutter ${className}`}>
      <header className="mb-gutter flex flex-wrap items-start justify-between gap-unit">
        <div>
          <h3 className="font-headline-md text-headline-md flex items-center gap-1.5 text-on-surface">
            <span className="material-symbols-outlined text-[22px] text-primary">trending_up</span>
            {title}
          </h3>
          <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
            Last {monthCount} months · {formatCompactCurrency(total)} from{' '}
            {count} {count === 1 ? 'policy' : 'policies'}
          </p>
        </div>

        {/* This month, called out in words rather than left for the reader to
            find at the right-hand end of the plot. Proportional figures, not
            the tabular token: equal-width digits make a large standalone
            number look gappy, and nothing is aligned under it. */}
        <div className="text-right">
          <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            This month
          </p>
          <p className="text-headline-md font-semibold text-on-surface">
            {formatCompactCurrency(current?.premium ?? 0)}
          </p>
          {action}
        </div>
      </header>

      {isEmpty ? (
        <p className="font-body-md text-body-md rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-center text-on-surface-variant">
          No policies written in the last {monthCount} months.
        </p>
      ) : (
        <>
          {/*
            The plot and the month labels are separate rows of one flex column,
            so the card's height is the plot *plus* the axis band. Fixing a
            height on the whole thing is what leaves the x-axis labels clipped
            or scrolling inside their own card.
          */}
          <div className="flex flex-col">
            <div className="relative h-56">
              {/* Y axis. `w-12` is reserved on the left for the ticks; the plot
                  starts after it. Tabular figures here, where the numbers do
                  stack vertically and want to align. */}
              <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 flex-col justify-between">
                {TICKS.map((t) => (
                  <span
                    key={t}
                    className="font-data-mono -translate-y-1.5 text-[11px] text-on-surface-variant/80"
                  >
                    {formatCompactCurrency(Math.round(scaleMax * t))}
                  </span>
                ))}
              </div>

              {/* Gridlines: solid hairlines one step off the surface. Not
                  dashed — dashing reads as a projection or a threshold when it
                  is only a grid, and adds noise the data should own. */}
              <div className="pointer-events-none absolute inset-y-0 left-12 right-0 flex flex-col justify-between">
                {TICKS.map((t) => (
                  <div
                    key={t}
                    /* Neutral grey, not the warm `outline-variant` brand tint:
                       at four repeats a pink hairline stops reading as chrome
                       and starts competing with the bars. The baseline is one
                       step stronger because it is the zero the bars stand on. */
                    className={t === 0 ? 'border-t border-slate-300' : 'border-t border-slate-200'}
                  />
                ))}
              </div>

              <div className="absolute inset-y-0 left-12 right-0 flex items-end gap-1">
                {months.map((m, i) => {
                  const pct = (m.premium / scaleMax) * 100;
                  // Every month gets a mark. A zero month draws a 2px stub on
                  // the baseline rather than nothing, so a quiet April reads as
                  // "nothing sold" instead of a column that failed to render.
                  const height = m.premium > 0 ? `${Math.max(pct, 1.5)}%` : '2px';
                  const labelled = m.isCurrent || m.key === best?.key;

                  /* Where the tooltip hangs. It is ~160px wide over a ~30px
                     column, so a centred one on an end column overhangs the
                     card. The two columns at each end anchor to their own edge
                     instead and open inwards; everything between stays centred. */
                  const tip =
                    i <= 1
                      ? 'left-0'
                      : i >= months.length - 2
                        ? 'right-0'
                        : 'left-1/2 -translate-x-1/2';

                  return (
                    <button
                      key={m.key}
                      type="button"
                      /* The hit area is the whole column, not the bar — a 14px
                         mark is far under the ~24px a pointer or thumb needs,
                         and the gap between bars belongs to the column beside
                         it rather than to nothing. */
                      className="group relative flex h-full flex-1 cursor-default flex-col justify-end focus-visible:outline-none"
                      aria-label={`${m.fullLabel}: ${formatCurrency(m.premium)} from ${m.count} ${m.count === 1 ? 'policy' : 'policies'}`}
                    >
                      {/* Direct labels, selectively — the peak and the current
                          month only. A value over all twelve is noise and goes
                          unread; the axis and the tooltip carry the rest. */}
                      {labelled && m.premium > 0 && (
                        /* Hidden below `sm`. Twelve columns in a 360px card
                           are ~20px each, and "₹38,650" is three times that —
                           it would spill across its neighbours and off the
                           plot. On a phone the axis, the tooltip and the table
                           carry the values instead; nothing becomes
                           unreachable, it just stops being shouted. */
                        <span className="font-data-mono pointer-events-none mb-1 hidden text-center text-[10px] font-semibold text-on-surface-variant sm:block">
                          {formatCompactCurrency(m.premium)}
                        </span>
                      )}

                      <div
                        style={{ height }}
                        /* Capped at 24px and centred, so a wide card gives the
                           column air instead of a fatter bar. Rounded at the
                           data end, square on the baseline. */
                        className={`mx-auto w-full max-w-6 rounded-t-[4px] transition-colors ${
                          m.isCurrent
                            ? 'bg-primary'
                            : 'bg-[#b5a396] group-hover:bg-[#9d8877] group-focus-visible:bg-[#9d8877]'
                        }`}
                      />

                      {/* Hover and focus show the same thing. `whitespace-nowrap`
                          plus a centred translate keeps it over its own column;
                          the two end columns would clip it against the card, so
                          the plot's own padding is what it has to live in. */}
                      {/*
                        `hidden` until shown, not `opacity-0`.

                        An invisible tooltip is still a laid-out 160px box, and
                        the ones on the last columns reached past the card into
                        the document's scroll width — so every phone got a page
                        that scrolled sideways onto nothing at all. `display:
                        none` takes it out of layout entirely; the cost is the
                        fade, which is not worth a horizontal scrollbar.
                      */}
                      <span
                        role="tooltip"
                        className={`pointer-events-none absolute -top-1 z-10 hidden whitespace-nowrap rounded bg-inverse-surface px-2 py-1 text-[11px] text-inverse-on-surface shadow-lg group-hover:block group-focus-visible:block ${tip}`}
                      >
                        <span className="font-semibold">{m.fullLabel}</span>
                        <span className="font-data-mono"> · {formatCurrency(m.premium)} · {m.count}p</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* The x-axis band, in flow under the plot and on the same grid. */}
            <div className="mt-1.5 flex gap-1 pl-12">
              {months.map((m) => (
                <span
                  key={m.key}
                  className={`font-data-mono flex-1 text-center text-[11px] ${
                    m.isCurrent ? 'font-bold text-on-surface' : 'text-on-surface-variant'
                  }`}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/*
            The table twin. Every figure in the plot is here as text, so the
            chart is never the only way to read a value — which is what lets the
            two fills sit under 3:1 contrast.

            A <details> rather than a toggle button: it is open-able, keyboard
            operable and announced correctly with no state to hold, and closed
            it costs one line.
          */}
          <details className="mt-4 border-t border-slate-100 pt-3">
            <summary className="font-body-md text-body-md cursor-pointer text-on-surface-variant marker:text-on-surface-variant hover:text-on-surface">
              View as table
            </summary>

            <div className="mt-2 overflow-x-auto">
              <table id={tableId} className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Premium booked and policies issued, by month, over the last {monthCount} months
                </caption>
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Month', 'Policies', 'Premium'].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`font-label-caps text-label-caps px-2 py-1.5 font-semibold uppercase text-on-surface-variant ${
                          i === 0 ? '' : 'text-right'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m.key} className="border-b border-slate-100 last:border-0">
                      <th
                        scope="row"
                        className={`font-body-md text-body-md px-2 py-1.5 font-normal ${
                          m.isCurrent ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
                        }`}
                      >
                        {m.fullLabel}
                        {m.isCurrent && ' (this month)'}
                      </th>
                      <td className="font-data-mono text-data-mono px-2 py-1.5 text-right text-on-surface-variant">
                        {m.count}
                      </td>
                      <td className="font-data-currency text-data-currency px-2 py-1.5 text-right text-on-surface">
                        {formatCurrency(m.premium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

export default PolicyTrend;
