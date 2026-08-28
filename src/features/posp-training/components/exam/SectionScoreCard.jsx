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
 * The percentage as the server wrote it — `3.33` stays `3.33`, `50` stays `50`.
 *
 * Rounding to whole numbers turned a 3.33% into "3%", which then disagreed with
 * the server's own sentence on the screen above it. A learner reading two
 * different scores for one paper has no way to know which is the real one.
 */
const formatPercentage = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(2));

/**
 * How the paper went: the verdict in the header, then what it was built from.
 * The percentage is the figure the learner is looking for, so it gets the size —
 * but in weight and colour only, not in the confetti the screen used to wear.
 *
 * Every figure on this card comes from the grading reply. Nothing is counted
 * here and nothing is compared here — the paper carried no answer key, so this
 * app has no standing to score it or to decide what passes.
 *
 * There is no "questions attempted" row for that reason. It was the one number
 * this browser was producing, and it could contradict the server outright: an
 * answer taken back with Clear leaves the local tally, and stays on file at the
 * server, so the card could report fewer attempts than the paper it is reporting
 * on.
 *
 * The marks row is **marks**, not correct answers. The server grades in marks
 * and a question is not obliged to be worth one — they happen to match on the
 * current paper (30 questions, 30 marks), and a card that said "correct answers"
 * would quietly start lying the day a question is worth two.
 */
function SectionScoreCard({ title, score }) {
  const { passed, obtainedMarks, totalMarks, percentage } = score;

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
        <ScoreRow label="Marks obtained" value={`${obtainedMarks} / ${totalMarks}`} />

        <div className="flex items-end justify-between pt-4">
          <span className="text-sm text-slate-500">Score</span>
          <span
            className={`font-mono text-3xl leading-none font-semibold tracking-tight tabular-nums ${
              passed ? 'text-emerald-600' : 'text-error'
            }`}
          >
            {formatPercentage(percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default SectionScoreCard;
