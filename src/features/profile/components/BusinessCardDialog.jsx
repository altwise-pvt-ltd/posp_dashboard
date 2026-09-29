import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import BusinessCardFront from '@/shared/components/BusinessCardFront';
import { renderBusinessCard } from '@/shared/lib/businessCardImage';
import { saveBlob } from '@/shared/lib/saveFile';

/**
 * The agent's card at a size they can actually read, and the button that saves
 * it.
 *
 * ⚠ PORTALLED TO `document.body`, AND IT HAS TO BE — same trap as
 * `marketing-kit/components/PreparedCardDialog`, written up in full there.
 * The profile rail sits inside `anim-fade`, whose `both`-filled keyframes
 * leave a permanent `transform` on the wrapper; any fixed descendant would
 * then size itself to that card rather than to the viewport and be clipped.
 *
 * THE PREVIEW AND THE FILE READ FROM ONE `fields` OBJECT. They are drawn by
 * two different renderers, so their pixels can differ by a hair — but the name
 * and the POSP ID on screen are literally the strings that get drawn into the
 * PNG, which is the part the agent is here to check.
 *
 * This card is landscape and wide rather than the marketing kit's 2:3 portrait,
 * so width is what constrains it: the card takes the dialog's width up to its
 * own 700px print size and shrinks itself from there.
 */
function BusinessCardDialog({ open, fields, onClose }) {
  const closeButtonRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* Clearing the failure here rather than in an effect on `open`: a setState
     in an effect body is a cascading render, and the only way back into this
     dialog is through one of these three exits anyway. */
  const close = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    closeButtonRef.current?.focus();

    /* The profile page behind this is long and the backdrop hides it, so a
       wheel or a swipe would scroll a page the agent cannot see moving.
       Restored to whatever it was rather than to '', in case something outer
       set it. */
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  /* Drawn on click rather than on open: the agent may well have come in just to
     look at it, and rasterising a card nobody saves costs a font load and a
     1400x800 canvas for nothing. */
  const download = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const blob = await renderBusinessCard(fields);
      saveBlob(blob, 'business-card.png');
    } catch (failure) {
      setError(failure.message || 'The card could not be saved.');
    } finally {
      setSaving(false);
    }
  }, [fields]);

  return createPortal(
    <AnimatePresence>
      {open && fields && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Your business card"
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-900/80 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            ref={closeButtonRef}
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="size-5" />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[700px]"
          >
            <BusinessCardFront {...fields} />
          </motion.div>

          <div
            onClick={(event) => event.stopPropagation()}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <CustomButton
              variant="primary"
              size="lg"
              leftIcon={<Download />}
              onClick={download}
              disabled={saving}
            >
              {saving ? 'Preparing…' : 'Download'}
            </CustomButton>

            <p className="font-body-md text-body-md text-white/70">
              {error || 'Saves as a PNG you can print or send.'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default BusinessCardDialog;
