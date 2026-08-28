import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

/**
 * One question and its options.
 *
 * The question is a heading on the page rather than a card: with the options
 * carrying every border on screen, boxing the question too flattens the two
 * into one undifferentiated stack, and the thing being asked stops leading.
 *
 * The options are buttons wearing radio semantics rather than real inputs: the
 * whole tile is the target, and `aria-checked` on a `role="radio"` keeps that
 * readable to assistive tech. Selection is carried by the border colour, the
 * filled letter and a tick — no size, weight or spacing changes with it, so
 * choosing an option never moves the list under the pointer. The caller keys
 * this component by question id so the transition runs on every move.
 */
function ExamQuestion({ question, questionNumber, questionCount, selectedOption, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-1 flex-col"
    >
      <div className="mb-6 md:mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="shrink-0 border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
            Question {questionNumber}
            <span className="text-slate-300"> / {questionCount}</span>
          </span>
          <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        </div>

        <h1 className="text-xl leading-snug font-semibold tracking-tight text-balance text-slate-900 md:text-2xl">
          {question.question}
        </h1>
      </div>

      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={question.question}>
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;

          return (
            <button
              // The option list is fixed and never reorders, so its position is
              // a stable identity — and unlike the text, it cannot collide.
              key={index}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-keyshortcuts={option.letter}
              onClick={() => onSelect(index)}
              className={`group flex w-full items-center gap-4 border p-4 text-left transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none md:gap-5 ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50/70'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-sm font-semibold transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:text-primary'
                }`}
                aria-hidden="true"
              >
                {option.letter}
              </span>

              <span
                className={`flex-1 text-base leading-snug ${
                  isSelected ? 'font-medium text-slate-900' : 'text-slate-700'
                }`}
              >
                {option.text}
              </span>

              {/* Kept in the layout at all times so the text column does not
                  re-wrap the moment an option is chosen. */}
              <Check
                size={16}
                strokeWidth={2.5}
                aria-hidden="true"
                className={`shrink-0 text-primary transition-opacity duration-150 ${
                  isSelected ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default ExamQuestion;
