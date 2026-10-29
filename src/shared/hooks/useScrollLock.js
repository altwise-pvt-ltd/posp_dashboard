import { useEffect } from 'react';

// The page body, plus any inner scroll area marked with data-scroll-root (the dashboard's <main>).
const SCROLL_ROOTS = 'body, [data-scroll-root]';

// Counted so one overlay closing while another is open doesn't unlock the page.
let locks = 0;
let saved = [];

const scrollbarWidth = (el) =>
  el === document.body
    ? window.innerWidth - document.documentElement.clientWidth
    : el.offsetWidth - el.clientWidth;

function lock() {
  if (locks === 0) {
    saved = Array.from(document.querySelectorAll(SCROLL_ROOTS)).map((el) => {
      const entry = { el, overflow: el.style.overflow, paddingRight: el.style.paddingRight };
      // Pad by the scrollbar's width so content doesn't shift when it disappears.
      const gap = scrollbarWidth(el);
      if (gap > 0) {
        const current = parseFloat(getComputedStyle(el).paddingRight) || 0;
        el.style.paddingRight = `${current + gap}px`;
      }
      el.style.overflow = 'hidden';
      return entry;
    });
  }
  locks += 1;
}

function unlock() {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;

  saved.forEach(({ el, overflow, paddingRight }) => {
    el.style.overflow = overflow;
    el.style.paddingRight = paddingRight;
  });
  saved = [];
}

// Stops the page behind an overlay from scrolling while `active`.
export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    lock();
    return unlock;
  }, [active]);
}
