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
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="absolute top-0 left-0 h-2 w-full bg-linear-to-r from-orange-400 to-amber-500" />

            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500">
              <TriangleAlert size={32} strokeWidth={2.5} aria-hidden="true" />
            </div>

            <h3 id="submit-section-title" className="mb-3 text-center text-2xl font-black text-slate-800">
              Submit Section?
            </h3>
            <p className="mb-8 text-center text-slate-500">
              Are you sure you want to submit and end this section early?{' '}
              <strong className="text-slate-700">You cannot return to it once submitted.</strong>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                ref={cancelButtonRef}
                onClick={onCancel}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-3 font-bold text-white shadow-[0_4px_10px_rgba(249,115,22,0.3)] transition-all hover:bg-orange-600 hover:shadow-[0_6px_15px_rgba(249,115,22,0.4)]"
              >
                Yes, Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SubmitSectionDialog;
