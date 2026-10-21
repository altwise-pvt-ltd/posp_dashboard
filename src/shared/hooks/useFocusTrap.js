import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Holds Tab inside `ref` while `active`. A container marked `aria-modal="true"`
 * has to keep focus; without this Tab walks out to the page behind the overlay.
 */
export function useFocusTrap(ref, active = true) {
  useEffect(() => {
    if (!active) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return;

      const root = ref.current;
      if (!root) return;

      // Hidden controls are skipped; a collapsed panel's buttons still match the selector.
      const items = Array.from(root.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (!root.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ref, active]);
}
