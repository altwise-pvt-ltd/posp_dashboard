/** A string with something in it, or null — `''` and `'  '` are both absences. */
export const text = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
};

/** A finite number, or null — null means "not given" and must not become 0. */
export const number = (value) => (Number.isFinite(value) ? value : null);

/** `KYC_PAN` → "Kyc Pan", for a code with no label of its own. */
export const humaniseCode = (code) =>
  String(code ?? '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
