// Scrolls a form field into view and focuses it.
export const focusField = (code) => {
  const node = document.getElementById(code);
  node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  node?.focus?.({ preventScroll: true });
};
