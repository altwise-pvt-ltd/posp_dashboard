/** One row of the score breakdown — label on the left, figures on the right. */
function ScoreRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-mono text-sm font-semibold text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

/**
 * How one section went: the verdict in the header, then what it was built from.
 * The percentage is the figure the learner is looking for, so it gets the size —
 * but in weight and colour only, not in the confetti the screen used to wear.
 */
function SectionScoreCard({ title, score }) {
  const { passed, attempted, correct, total, percentage } = score;

  return (
    <div className="border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
        <span
          className={`shrink-0 border px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase ${
            passed
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-error/30 bg-error/5 text-error'
          }`}
        >
          {passed ? 'Pass' : 'Fail'}
        </span>
      </div>

      <div className="px-4 pb-4">
        <ScoreRow label="Questions attempted" value={`${attempted} / ${total}`} />
        <ScoreRow label="Correct answers" value={`${correct} / ${total}`} />

        <div className="flex items-end justify-between pt-4">
          <span className="text-sm text-slate-500">Score</span>
          <span
            className={`font-mono text-3xl leading-none font-semibold tracking-tight tabular-nums ${
              passed ? 'text-emerald-600' : 'text-error'
            }`}
          >
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default SectionScoreCard;
