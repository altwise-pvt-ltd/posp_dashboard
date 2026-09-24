import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';

/**
 * Confirmation for sending a quote to be verified.
 *
 * Worth a stop because it is one way: there is no route to withdraw a quote
 * once it is with the back office, so the agent cannot undo this from the app.
 *
 * Built on the same bones as `SubmitSectionDialog` in the exam — focus lands on
 * Cancel, Escape closes, the backdrop closes — but wearing this module's shape
 * (`rounded-xl`, `CustomButton`) rather than the exam's squared-off styling.
 * The safe option is the one a keyboard reaches first, and the destructive one
 * is never what Enter fires by default.
 */
function VerificationDialog({ open, reference, submitting, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      // A dialog mid-request has already committed — closing it would leave the
      // call in flight with nothing on screen saying so.
      if (event.key === 'Escape' && !submitting) onCancel();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, submitting, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => !submitting && onCancel()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-dialog-title"
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.18)]"
          >
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/8 text-primary">
              <ShieldCheck size={22} strokeWidth={2} aria-hidden="true" />
            </div>

            <h3
              id="verification-dialog-title"
              className="font-headline-md text-headline-md text-on-surface"
            >
              Send for verification?
            </h3>
            <p className="font-body-md text-body-md mt-2 text-on-surface-variant">
              {reference ? (
                <>
                  <span className="font-data-mono font-semibold text-on-surface">{reference}</span>{' '}
                  goes to the team to be checked and passed to the insurer.
                </>
              ) : (
                'This quotation goes to the team to be checked and passed to the insurer.'
              )}{' '}
              <span className="font-medium text-on-surface">
                You won&apos;t be able to edit or withdraw it afterwards.
              </span>
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <CustomButton
                variant="secondary"
                size="md"
                fullWidth
                /* `autoFocus` rather than a ref: CustomButton spreads unknown
                   props onto its <button> but does not forward refs, and the
                   dialog mounts on open so this fires exactly once. */
                autoFocus
                disabled={submitting}
                onClick={onCancel}
              >
                Cancel
              </CustomButton>

              <CustomButton
                variant="primary"
                size="md"
                fullWidth
                loading={submitting}
                onClick={onConfirm}
              >
                {submitting ? 'Sending' : 'Yes, send it'}
              </CustomButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default VerificationDialog;
