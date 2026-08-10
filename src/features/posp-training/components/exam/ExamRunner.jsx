import { useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, Shrink } from 'lucide-react';
import { EXAM_SHELL } from './examShell';
import ExamHeader from './ExamHeader';
import ExamNavigator from './ExamNavigator';
import ExamQuestion from './ExamQuestion';
import ExamToast from './ExamToast';
import SubmitSectionDialog from './SubmitSectionDialog';

/**
 * The live exam screen for one section: the question on the left, the
 * navigator on the right.
 *
 * The portal mounts this with `key={section.id}`, so everything that is only
 * true of the current section — which question is showing, whether the submit
 * dialog is open — resets by unmounting rather than through a pile of
 * resetting setState calls one level up. Answers and the clock stay with the
 * portal, because those outlive the section.
 */
function ExamRunner({
  section,
  questions,
  answers,
  secondsLeft,
  toast,
  onDismissToast,
  onSelectOption,
  onClearAnswer,
  onSubmitSection,
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const question = questions[questionIndex];
  const selectedOption = answers[question.id];
  const isFirstQuestion = questionIndex === 0;
  const isLastQuestion = questionIndex === questions.length - 1;

  // Stable so the dialog's focus/Escape effect doesn't re-run — and re-steal
  // focus — on every tick of the clock.
  const closeSubmitDialog = useCallback(() => setIsSubmitDialogOpen(false), []);
  const openSubmitDialog = () => setIsSubmitDialogOpen(true);

  const goToPrevious = () => setQuestionIndex((index) => Math.max(0, index - 1));
  const goToNext = () => setQuestionIndex((index) => Math.min(questions.length - 1, index + 1));

  return (
    <div
      className={`${EXAM_SHELL} flex flex-col overflow-hidden border border-slate-200 bg-slate-50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] lg:flex-row`}
    >
      <ExamToast message={toast} onDismiss={onDismissToast} />

      {/* Left: the question being answered */}
      <div className="relative z-10 flex flex-1 flex-col lg:h-full lg:overflow-y-auto">
        <ExamHeader
          sectionTitle={section.title}
          questionNumber={questionIndex + 1}
          questionCount={questions.length}
          secondsLeft={secondsLeft}
          onSubmit={openSubmitDialog}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col p-4 md:p-6 md:py-8">
          <AnimatePresence mode="wait">
            <ExamQuestion
              key={question.id}
              question={question}
              questionNumber={questionIndex + 1}
              selectedOption={selectedOption}
              onSelect={(optionIndex) => onSelectOption(question.id, optionIndex)}
            />
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 sm:flex-nowrap">
            <button
              type="button"
              onClick={goToPrevious}
              disabled={isFirstQuestion}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isFirstQuestion ? 'cursor-not-allowed text-slate-300' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </button>

            <div className="flex items-center gap-3">
              {selectedOption !== undefined && (
                <button
                  type="button"
                  onClick={() => onClearAnswer(question.id)}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <Shrink size={16} aria-hidden="true" />
                  Clear Response
                </button>
              )}

              <button
                type="button"
                onClick={goToNext}
                disabled={isLastQuestion}
                className={`flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors ${
                  isLastQuestion
                    ? 'cursor-not-allowed border border-transparent bg-slate-200 text-slate-400'
                    : 'bg-orange-500 text-white shadow-sm hover:bg-orange-600'
                }`}
              >
                Save and Next
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: progress and jump-to-question */}
      <ExamNavigator
        sectionLabel={section.label}
        questions={questions}
        answers={answers}
        currentIndex={questionIndex}
        onJump={setQuestionIndex}
        onSubmit={openSubmitDialog}
      />

      <SubmitSectionDialog
        open={isSubmitDialogOpen}
        onCancel={closeSubmitDialog}
        onConfirm={() => {
          closeSubmitDialog();
          onSubmitSection();
        }}
      />
    </div>
  );
}

export default ExamRunner;
