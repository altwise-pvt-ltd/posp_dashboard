/** Motion for the insurer response list. */

const STAGGER = 0.07;

/** Cards rise in one after another; later opacity changes run without the stagger. */
export const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  shown: ({ index, opacity, entered }) => ({
    opacity,
    y: 0,
    transition: {
      delay: entered ? 0 : index * STAGGER,
      y: { type: 'spring', stiffness: 260, damping: 24 },
      opacity: { duration: 0.35, ease: 'easeOut' },
    },
  }),
};

/** Cards slide to their new place when the sort changes. */
export const CARD_TRANSITION = { layout: { type: 'spring', stiffness: 380, damping: 34 } };

/** Card opacity: expired cards fade most, unchosen ones a little. */
export const cardOpacity = ({ expired, dimmed }) => (expired ? 0.6 : dimmed ? 0.8 : 1);

/** One ripple out from the card border when it becomes the selected one. */
export const SELECT_RIPPLE = {
  initial: { boxShadow: '0 0 0 0px rgba(244, 124, 60, 0.45)' },
  animate: { boxShadow: '0 0 0 12px rgba(244, 124, 60, 0)' },
  transition: { duration: 0.9, ease: 'easeOut' },
};

/** "Selected" pill springs in; the check draws itself after. */
export const PILL_IN = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { type: 'spring', stiffness: 420, damping: 20 },
};

export const CHECK_DRAW = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { duration: 0.4, delay: 0.15, ease: 'easeOut' },
};

/** Select button fades and shrinks out as the pill replaces it. */
export const BUTTON_OUT = {
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.15 },
};

/** Light sweep across the select button on hover. */
export const SHINE =
  'relative overflow-hidden before:pointer-events-none before:absolute before:inset-y-0 before:-left-3/4 before:w-1/2 before:-skew-x-20 before:bg-linear-to-r before:from-transparent before:via-white/45 before:to-transparent before:transition-[left] before:duration-700 before:ease-out hover:before:left-[125%] disabled:before:hidden motion-reduce:before:hidden';
