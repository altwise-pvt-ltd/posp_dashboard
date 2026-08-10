import { motion } from 'framer-motion';

/** a), b), c), … for the option at `index`. */
const optionLetter = (index) => `${String.fromCharCode(97 + index)})`;

/**
 * One question and its options.
 *
 * The options are buttons wearing radio semantics rather than real inputs: the
 * whole tile is the target, and `aria-checked` on a `role="radio"` keeps that
 * readable to assistive tech. The caller keys this component by question id so
 * the slide transition runs on every move.
 */
function ExamQuestion({ question, questionNumber, selectedOption, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col"
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="text-base font-bold text-slate-800 md:text-lg">Q: {questionNumber}</div>
      </div>

      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-5 text-base leading-relaxed text-slate-800 shadow-sm md:p-6 md:text-lg">
        {question.question}
      </div>

      <div className="flex flex-col gap-3 md:gap-4" role="radiogroup" aria-label={question.question}>
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
              onClick={() => onSelect(index)}
              className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-all duration-200 md:p-5 ${
                isSelected
                  ? 'border-orange-500 bg-orange-50 font-medium text-orange-900 shadow-[0_2px_10px_rgba(249,115,22,0.08)]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50/40'
              }`}
            >
              <div
                className={`shrink-0 text-base font-bold md:text-lg ${
                  isSelected ? 'text-orange-600' : 'text-slate-800'
                }`}
              >
                {optionLetter(index)}
              </div>
              <span className="text-base leading-snug md:text-lg">{option}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default ExamQuestion;
