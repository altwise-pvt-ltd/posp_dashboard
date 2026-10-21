/** Sentence case for UI labels: "Bank transfer", not "BANK_TRANSFER" or "Bank Transfer". */
export const humanizeLabel = (value) => {
  if (!value) return '';

  const words = String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\s-]+/)
    .filter(Boolean);

  if (words.length === 0) return '';

  return words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase()
    )
    .join(' ');
};
