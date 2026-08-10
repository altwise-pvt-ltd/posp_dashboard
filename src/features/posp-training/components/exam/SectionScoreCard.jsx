/** One row of the score breakdown — label on the left, figures on the right. */
function ScoreRow({ label, value, divided = true }) {
  return (
    <div
      className={`flex items-center justify-between ${
        divided ? 'mb-3 border-b border-slate-100 pb-3 md:mb-4 md:pb-4' : ''
      }`}
    >
      <span className="text-xs font-medium text-slate-500 md:text-sm">{label}</span>
      <span className="text-sm font-bold text-slate-800 md:text-base">{value}</span>
    </div>
  );
}

/**
 * How one section went: the verdict in the header, then what it was built from.
 * The percentage is the figure the learner is looking for, so it gets the size.
 */
function SectionScoreCard({ title, score }) {
  const { passed, attempted, correct, total, percentage } = score;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div
        className={`flex items-center justify-between border-b p-3 md:p-4 ${
          passed ? 'border-green-50 bg-[#f4fcf6]' : 'border-red-50 bg-red-50'
        }`}
      >
        <h3 className={`text-base font-bold md:text-lg ${passed ? 'text-emerald-800' : 'text-red-800'}`}>
          {title}
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase md:px-3 md:py-1 md:text-xs ${
            passed ? 'bg-green-200/50 text-green-700' : 'bg-red-200/50 text-red-700'
          }`}
        >
          {passed ? 'Pass' : 'Fail'}
        </span>
      </div>

      <div className="p-4 md:p-5">
        <ScoreRow label="Questions Attempted" value={`${attempted} / ${total}`} />
        <ScoreRow label="Correct Answers" value={`${correct} / ${total}`} />

        <div className="mt-1 flex items-end justify-between md:mt-2">
          <span className="text-xs font-medium text-slate-500 md:text-sm">Score</span>
          <span
            className={`text-4xl font-bold tracking-tight md:text-5xl ${
              passed ? 'text-[#10b981]' : 'text-red-500'
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
