import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TriangleAlert } from 'lucide-react';

/**
 * Confirmation for ending a section early. Submitting is one-way, so it is
 * worth a stop: the learner cannot come back to these questions.
 *
 * Focus moves to Cancel on open and Escape closes the dialog, so the safe
 * option is the one a keyboard reaches first.
 */
function SubmitSectionDialog({ open, onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    cancelButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-section-title"
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md border-t-2 border-primary bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.18)] md:p-8"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center border border-primary/25 bg-primary/8 text-primary">
              <TriangleAlert size={22} strokeWidth={2} aria-hidden="true" />
            </div>

            <h3 id="submit-section-title" className="mb-2 text-xl font-semibold text-slate-900">
              Submit this section?
            </h3>
            <p className="mb-8 text-sm leading-relaxed text-slate-500">
              Submitting ends the section early.{' '}
              <span className="font-medium text-slate-700">
                You cannot return to these questions once submitted.
              </span>
            </p>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                ref={cancelButtonRef}
                onClick={onCancel}
                className="flex-1 border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant"
              >
                Yes, submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SubmitSectionDialog;
