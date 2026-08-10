import ResultsBanner from './ResultsBanner';
import ResultsMedal from './ResultsMedal';
import SectionScoreCard from './SectionScoreCard';

/**
 * The verdict.
 *
 * Every section has to be cleared on its own, so the overall result is only as
 * good as the weakest card below it — and the one way forward changes with it:
 * on to the dashboard, or back through the training.
 *
 * `results` arrives already scored, one `{ section, score }` per section sat:
 * the portal holds both the answers and the question bank, so it does the
 * scoring and this screen stays presentation, like every other exam screen.
 */
function ExamResults({ results, onGoToDashboard, onRetakeTraining }) {
  const passed = results.every((result) => result.score.passed);

  return (
    <div className="flex min-h-screen w-full flex-col items-center overflow-x-hidden bg-white">
      <ResultsBanner passed={passed} />

      <div className="mx-auto flex w-full max-w-4xl flex-col pb-6 md:pb-8">
        <ResultsMedal passed={passed} />

        <div className="shrink-0 bg-white px-6 pb-6 text-center">
          <h2 className="mb-2 text-3xl font-black tracking-tight text-slate-800 md:text-4xl">
            {passed ? 'Congratulations!' : 'Almost There!'}
          </h2>
          <p className="text-base font-medium text-slate-500 md:text-lg">
            {passed
              ? 'You did a great job in the test!'
              : 'Review the material and give it another shot.'}
          </p>
        </div>

        <div className="bg-white px-4 pb-6 md:px-12 md:pb-8">
          {/* A single section has no second column to balance against, so it is
              centred at a readable width instead of stretched across the page. */}
          <div
            className={`grid grid-cols-1 gap-6 md:gap-8 ${
              results.length > 1 ? 'md:grid-cols-2' : 'mx-auto max-w-md'
            }`}
          >
            {results.map(({ section, score }) => (
              <SectionScoreCard key={section.id} title={section.title} score={score} />
            ))}
          </div>
        </div>

        <div className="w-full pt-2 pb-8 text-center md:pb-10">
          {passed ? (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="rounded-xl bg-linear-to-r from-orange-500 to-amber-500 px-8 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] transition-all hover:-translate-y-0.5 hover:from-orange-600 hover:to-amber-600 hover:shadow-[0_8px_25px_rgba(249,115,22,0.4)] md:px-10 md:py-4 md:text-lg"
            >
              Welcome to Dashboard
            </button>
          ) : (
            <button
              type="button"
              onClick={onRetakeTraining}
              className="rounded-xl bg-orange-500 px-8 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[0_8px_25px_rgba(249,115,22,0.4)] md:px-10 md:py-4 md:text-lg"
            >
              Start Training Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExamResults;
