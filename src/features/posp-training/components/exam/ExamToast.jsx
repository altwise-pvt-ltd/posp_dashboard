import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const DISMISS_AFTER_MS = 4000;

/**
 * The time-remaining warning that floats over the exam.
 *
 * Non-blocking by design: `alert()` would freeze the very clock the learner is
 * being warned about. Announced assertively so a screen reader interrupts with
 * it, and it clears itself so it never sits on top of a question.
 *
 * `onDismiss` must be stable (the caller wraps it in useCallback) — the exam
 * re-renders every second, and an inline arrow would restart the timeout each
 * time and leave the toast up forever.
 */
function ExamToast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;

    const timeout = setTimeout(onDismiss, DISMISS_AFTER_MS);
    return () => clearTimeout(timeout);
  }, [message, onDismiss]);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed top-4 left-1/2 z-60 w-full max-w-sm -translate-x-1/2 px-4"
    >
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            role="status"
            className="flex items-center gap-3 border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.10)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/25 bg-primary/8 text-primary">
              <Clock size={16} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-slate-800">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExamToast;
