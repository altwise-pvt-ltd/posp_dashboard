/**
 * The wizard's *inner* progress indicator: which section of the quote form the
 * user is on, inside the form panel.
 *
 * It is a bar at every width, unlike the three top-level steps above it, which
 * become chips from `sm` up. Chips stay reserved for those three: a product can
 * publish any number of sections, and a chip row with no ceiling overflows.
 *
 * The fill counts sections *completed* (`current / total`), so arriving at the
 * last screen does not read as finished.
 */
function QuoteSectionProgress({ label, current, total, headingRef }) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="font-headline-md text-headline-md min-w-0 text-on-surface outline-none"
        >
          {label}
        </h3>
        <p className="text-[0.6875rem] font-medium whitespace-nowrap text-slate-400">
          {current + 1} of {total}
        </p>
      </div>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default QuoteSectionProgress;
