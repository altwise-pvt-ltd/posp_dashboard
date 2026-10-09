import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

/**
 * Asks before leaving a running exam. Focus starts on "No" and Escape means
 * "No", so staying on the paper is the default.
 */
function ExitExamDialog({ open, onStay, onExit }) {
  const stayButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    stayButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onStay();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onStay]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={onStay}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="exit-exam-title"
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md border-t-2 border-error bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.18)] md:p-8"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center border border-error/30 bg-error/5 text-error">
              <LogOut size={22} strokeWidth={2} aria-hidden="true" />
            </div>

            <h3 id="exit-exam-title" className="mb-8 text-xl font-semibold text-slate-900">
              Do you want to exit the exam?
            </h3>

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
              <button
                type="button"
                ref={stayButtonRef}
                onClick={onStay}
                className="flex-1 border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                No
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex-1 bg-error px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-error/90"
              >
                Yes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ExitExamDialog;
