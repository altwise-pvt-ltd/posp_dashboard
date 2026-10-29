// A trimmed non-empty string, or null.
export const text = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
};

// A finite number, or null when missing (never 0).
export const number = (value) => (Number.isFinite(value) ? value : null);

// Like number(), but also reads a numeric string such as "1500". Blank text gives null.
export const numeric = (value) => {
  if (Number.isFinite(value)) return value;
  const trimmed = typeof value === 'string' ? value.trim() : '';
  const parsed = trimmed ? Number(trimmed) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

// A date as milliseconds for sorting; 0 when missing or unreadable.
export const timeOf = (value) => {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

// KYC_PAN -> "Kyc Pan".
export const humaniseCode = (code) =>
  String(code ?? '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
