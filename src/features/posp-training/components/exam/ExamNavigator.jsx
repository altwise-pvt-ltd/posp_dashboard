import { Check } from 'lucide-react';

/**
 * The side panel: how much of the section is done, a grid to jump anywhere in
 * it, and the submit button.
 */
function ExamNavigator({ sectionLabel, questions, answers, currentIndex, onJump, onSubmit }) {
  const attempted = questions.filter((question) => answers[question.id] !== undefined).length;
  const notAttempted = questions.length - attempted;

  return (
    <div className="relative z-20 flex w-full shrink-0 flex-col border-t border-slate-200 bg-slate-50 lg:h-full lg:w-72 lg:border-t-0 lg:border-l">
      <div className="border-b border-slate-200 bg-white p-4 md:p-5">
        <h3 className="mb-3 text-sm font-bold text-slate-800">{sectionLabel} Summary</h3>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl border border-orange-100 bg-orange-50 p-2.5 text-center">
            <div className="text-xl font-black text-orange-600">{attempted}</div>
            <div className="mt-0.5 text-[9px] font-bold tracking-wider text-orange-700 uppercase">
              Attempted
            </div>
          </div>
          <div className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-center">
            <div className="text-xl font-black text-slate-500">{notAttempted}</div>
            <div className="mt-0.5 text-[9px] font-bold tracking-wider text-slate-400 uppercase">
              Not Answered
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-5 lg:overflow-y-auto">
        <p className="mb-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Questions Navigation
        </p>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((question, index) => {
            const isAttempted = answers[question.id] !== undefined;
            const isCurrent = index === currentIndex;

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => onJump(index)}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={`Question ${index + 1}${isAttempted ? ', answered' : ', not answered'}${
                  isCurrent ? ', current' : ''
                }`}
                className={`flex aspect-square w-full items-center justify-center rounded-lg text-sm font-bold transition-all duration-200 ${
                  isCurrent ? 'z-10 ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-50' : ''
                } ${
                  isAttempted
                    ? 'bg-orange-500 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-slate-200 bg-white p-4">
        <button
          type="button"
          onClick={onSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 font-bold text-white transition-all hover:bg-orange-600"
        >
          Submit Section
          <Check size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default ExamNavigator;
