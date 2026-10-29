// Progress through the form's sections; the fill counts completed sections (current / total).
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
        <p className="text-[0.6875rem] font-medium whitespace-nowrap text-ink-faint">
          {current + 1} of {total}
        </p>
      </div>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-well-deep">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default QuoteSectionProgress;
