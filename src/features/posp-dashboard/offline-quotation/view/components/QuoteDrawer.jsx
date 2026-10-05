import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';

/* Counted so one drawer closing while the next opens doesn't unlock the page. */
let locks = 0;
let savedOverflow = '';

const lockScroll = () => {
  if (locks === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  locks += 1;
};

const unlockScroll = () => {
  locks = Math.max(0, locks - 1);
  if (locks === 0) document.body.style.overflow = savedOverflow;
};

/**
 * Right-hand drawer frame for the quote detail page. Render it inside an
 * `AnimatePresence` so it can animate out.
 */
function QuoteDrawer({ title, reference, onClose, onBack, footer, children, labelId }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    lockScroll();
    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    return () => {
      unlockScroll();
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby={labelId}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
      />

      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 40 }}
        className="dashboard-scale relative flex h-full w-full flex-col bg-white shadow-xl sm:max-w-md"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-gutter">
          <div className="flex min-w-0 items-start gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
              </button>
            )}
            <div className="min-w-0">
              {reference && (
                <p className="font-data-mono text-data-mono font-semibold text-on-surface">{reference}</p>
              )}
              <h2 id={labelId} className="font-headline-md text-headline-md text-on-surface">
                {title}
              </h2>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()}`}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        {children}

        {footer && (
          <footer className="flex gap-2 border-t border-slate-200 px-4 py-3 sm:px-gutter">{footer}</footer>
        )}
      </motion.aside>
    </div>
  );
}

export default QuoteDrawer;
