import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import { saveBlob } from '../lib/saveFile';
import { fileNameFor } from '../lib/fileName';

/**
 * The prepared card, shown before it is saved.
 *
 * WHAT IS ON SCREEN IS THE FILE. The `<img>` points at the object URL of the
 * exact blob the download button writes — not a CSS mock-up of the footer, not
 * the original artwork with an overlay. If the agent's name were ever going to
 * come out wrong, this is where they would see it, and a preview that rebuilt
 * the layout a second way could show them something the file does not contain.
 *
 * A LIGHTBOX, NOT A PANEL. The first version was a bordered card with a
 * heading, a scroll region and a button bar, and the card inside it came out
 * both smaller than the dialog's chrome and too tall for it — so the agent got
 * a scrollbar, and the footer they were here to check was the part below the
 * fold. Whatever cannot be seen at a glance is not a preview. So there is no
 * panel: the image sits on the backdrop at the largest size that fits, and the
 * only chrome is a close control and the one button this screen exists for.
 *
 * Height is what constrains it — these are ~2:3 portrait cards — so the image
 * is capped in `dvh` and left to take whatever width that implies. `dvh` rather
 * than `vh` because mobile browser chrome retracts on scroll, and `vh` measures
 * the viewport as if it already had.
 *
 * ⚠ PORTALLED TO `document.body`, AND IT HAS TO BE. `position: fixed` resolves
 * against the viewport only while no ancestor is a containing block, and the
 * page's own panel is one: `anim-fade-d1` is `animation: fadeUp ... both`,
 * `fadeUp` animates `transform`, and `both` means the element keeps
 * `transform: translateY(0)` permanently once it finishes. A transform that is
 * not `none` makes that element the containing block for every fixed
 * descendant — so `inset-0` sized this to the panel instead of the screen, and
 * the panel's `overflow-hidden rounded-xl` then clipped the top of the card and
 * the download button clean off. Rendering outside the tree is the fix; moving
 * the animation would only push the same trap onto the next dialog.
 */
function PreparedCardDialog({ open, card, title, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    closeButtonRef.current?.focus();

    /* The grid behind this is long and the backdrop covers it, so a wheel or a
       swipe over the preview would scroll a page the agent cannot see moving —
       and leave them somewhere else entirely when they close it. Restored to
       whatever it was rather than to '', in case something outer set it. */
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const download = () => {
    if (card) saveBlob(card.blob, fileNameFor(title, 'jpg'));
  };

  return createPortal(
    <AnimatePresence>
      {open && card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — ready to download`}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-900/80 p-4 backdrop-blur-sm"
        >
          {/* Floats over the backdrop rather than sitting in a title bar — a
              header row would be the one piece of window chrome left, and it
              would push the card down for no information the agent needs. */}
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="size-5" />
          </button>

          <motion.img
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            src={card.url}
            alt={`${title}, with your name and POSP ID on it`}
            /* `w-auto` with a capped height is what makes the element hug the
               image instead of letterboxing inside a wider box — the rounding
               and the shadow then follow the card's real edge. The reserved
               10rem is the button, the caption, the gaps and the padding.
               Underscores, not spaces: Tailwind reads them back as the
               whitespace `calc()` requires around a minus, and `calc(100dvh-
               10rem)` written literally is invalid CSS that silently drops. */
            onClick={(event) => event.stopPropagation()}
            className="max-h-[calc(100dvh_-_10rem)] w-auto max-w-full rounded-xl object-contain shadow-2xl"
          />

          <div
            onClick={(event) => event.stopPropagation()}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <CustomButton
              variant="primary"
              size="lg"
              leftIcon={<Download />}
              onClick={download}
            >
              Download
            </CustomButton>

            <p className="font-body-md text-body-md text-white/70">
              Save it, then share it from your gallery.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default PreparedCardDialog;
