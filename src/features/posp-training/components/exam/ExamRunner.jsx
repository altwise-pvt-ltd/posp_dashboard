import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, RotateCcw } from 'lucide-react';
import { EXAM_SHELL } from './examShell';
import ExamHeader from './ExamHeader';
import ExamNavigator from './ExamNavigator';
import ExamQuestion from './ExamQuestion';
import ExamToast from './ExamToast';
import SubmitSectionDialog from './SubmitSectionDialog';

/** The letters printed on the option tiles, in the order they are printed. */
const OPTION_KEYS = 'abcdefghij';

/** Shared look for the keyboard-hint keycaps in the action bar. */
const KEYCAP = 'border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500';

/**
 * The option a keypress picks, or null if the key does not answer anything.
 *
 * Both the letter on the tile and its place in the list work — a learner
 * reaches for whichever they happen to see — and a key past the end of the
 * list answers nothing rather than the last option.
 */
function optionIndexFromKey(key, optionCount) {
  if (key.length !== 1) return null;

  const digit = Number(key);
  const index =
    Number.isInteger(digit) && digit > 0 ? digit - 1 : OPTION_KEYS.indexOf(key.toLowerCase());

  return index >= 0 && index < optionCount ? index : null;
}

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
  // Counted once here: the header draws its progress hairline from it and the
  // navigator its percentage, and both must agree.
  const answeredCount = questions.filter((entry) => answers[entry.id] !== undefined).length;

  // Stable so the dialog's focus/Escape effect doesn't re-run — and re-steal
  // focus — on every tick of the clock.
  const closeSubmitDialog = useCallback(() => setIsSubmitDialogOpen(false), []);
  const openSubmitDialog = () => setIsSubmitDialogOpen(true);

  const goToPrevious = () => setQuestionIndex((index) => Math.max(0, index - 1));
  const goToNext = () => setQuestionIndex((index) => Math.min(questions.length - 1, index + 1));

  /**
   * Answer with A–D (or 1–4) and move with the arrow keys.
   *
   * Bound to the window rather than to a container, because in an exam the
   * shortcut has to work from wherever focus happens to be sitting — a learner
   * who has just clicked a tile should not have to click the page first. The
   * dialog owns the keyboard while it is open, so this stands down for it.
   *
   * The listener is re-bound as the question changes, which the running clock
   * makes frequent; one window listener is cheap enough that keeping the
   * handler honest is the better trade.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isSubmitDialogOpen || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'ArrowRight') {
        setQuestionIndex((index) => Math.min(questions.length - 1, index + 1));
        return;
      }
      if (event.key === 'ArrowLeft') {
        setQuestionIndex((index) => Math.max(0, index - 1));
        return;
      }

      const optionIndex = optionIndexFromKey(event.key, question.options.length);
      if (optionIndex !== null) {
        event.preventDefault();
        onSelectOption(question.id, optionIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitDialogOpen, question, questions.length, onSelectOption]);

  return (
    <div
      className={`${EXAM_SHELL} flex flex-col overflow-hidden border border-slate-200 bg-slate-50 lg:flex-row`}
    >
      <ExamToast message={toast} onDismiss={onDismissToast} />

      {/* Left: the question being answered */}
      <div className="relative z-10 flex flex-1 flex-col lg:h-full lg:overflow-y-auto">
        <ExamHeader
          sectionTitle={section.title}
          questionNumber={questionIndex + 1}
          questionCount={questions.length}
          answeredCount={answeredCount}
          secondsLeft={secondsLeft}
          onSubmit={openSubmitDialog}
        />

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 md:px-6 md:py-10">
          <AnimatePresence mode="wait">
            <ExamQuestion
              key={question.id}
              question={question}
              questionNumber={questionIndex + 1}
              questionCount={questions.length}
              selectedOption={selectedOption}
              onSelect={(optionIndex) => onSelectOption(question.id, optionIndex)}
            />
          </AnimatePresence>
        </div>

        {/* Moving on stays within reach however long the option list runs */}
        <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPrevious}
              disabled={isFirstQuestion}
              className={`flex items-center gap-1.5 border px-3.5 py-2.5 text-sm font-medium transition-colors md:px-4 ${
                isFirstQuestion
                  ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              Previous
            </button>

            <p className="hidden items-center gap-1.5 text-[11px] text-slate-400 lg:flex">
              <kbd className={KEYCAP}>A</kbd>–<kbd className={KEYCAP}>D</kbd>
              to answer
              <span className="mx-1 text-slate-300">·</span>
              <kbd className={KEYCAP}>←</kbd>
              <kbd className={KEYCAP}>→</kbd>
              to move
            </p>

            <div className="flex items-center gap-2">
              {selectedOption !== undefined && (
                <button
                  type="button"
                  onClick={() => onClearAnswer(question.id)}
                  className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
                >
                  <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}

              {/* The last question has nowhere to go next, so the primary
                  action becomes handing the section in rather than a dead
                  button the learner has to work around. */}
              <button
                type="button"
                onClick={isLastQuestion ? openSubmitDialog : goToNext}
                className="flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-on-primary-fixed-variant focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none md:px-6"
              >
                {isLastQuestion ? 'Review & Submit' : 'Save & Next'}
                {isLastQuestion ? (
                  <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                )}
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
        answeredCount={answeredCount}
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
