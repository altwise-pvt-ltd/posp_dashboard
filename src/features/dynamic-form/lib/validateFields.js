import { isValuelessControl } from '../components/fields/registry';

const slug = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const RULE_ALIASES = {
  required: 'required',
  mandatory: 'required',
  notnull: 'required',
  notempty: 'required',

  minlength: 'minLength',
  minlen: 'minLength',
  minimumlength: 'minLength',

  maxlength: 'maxLength',
  maxlen: 'maxLength',
  maximumlength: 'maxLength',

  length: 'length',
  exactlength: 'length',
  fixedlength: 'length',

  min: 'min',
  minvalue: 'min',
  minimum: 'min',
  gte: 'min',

  max: 'max',
  maxvalue: 'max',
  maximum: 'max',
  lte: 'max',

  range: 'range',
  between: 'range',

  regex: 'pattern',
  pattern: 'pattern',
  regularexpression: 'pattern',
  matches: 'pattern',
  match: 'pattern',

  email: 'email',
  emailaddress: 'email',

  mobile: 'mobile',
  phone: 'mobile',
  phonenumber: 'mobile',
  tel: 'mobile',
  contactnumber: 'mobile',

  pan: 'pan',
  pannumber: 'pan',

  aadhaar: 'aadhaar',
  aadhar: 'aadhaar',
  aadhaarnumber: 'aadhaar',
  aadharnumber: 'aadhaar',

  gst: 'gst',
  gstin: 'gst',
  gstnumber: 'gst',

  ifsc: 'ifsc',
  ifsccode: 'ifsc',

  pincode: 'pincode',
  pin: 'pincode',
  zipcode: 'pincode',
  postalcode: 'pincode',

  numeric: 'numeric',
  number: 'numeric',
  digits: 'numeric',
  digitsonly: 'numeric',

  alpha: 'alpha',
  alphabets: 'alpha',
  lettersonly: 'alpha',

  alphanumeric: 'alphanumeric',

  url: 'url',
  website: 'url',

  mindate: 'minDate',
  maxdate: 'maxDate',
  minage: 'minAge',
  maxage: 'maxAge',
};

const COMPACT_PATTERNS = {
  mobile: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'],
  pan: [/^[A-Za-z]{5}\d{4}[A-Za-z]$/, 'Enter a valid PAN, like ABCDE1234F'],
  aadhaar: [/^\d{12}$/, 'Enter a valid 12-digit Aadhaar number'],
  gst: [/^\d{2}[A-Za-z]{5}\d{4}[A-Za-z][A-Za-z0-9][Zz][A-Za-z0-9]$/, 'Enter a valid GSTIN'],
  ifsc: [/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, 'Enter a valid IFSC code'],
  pincode: [/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code'],
  numeric: [/^\d+$/, 'Use digits only'],
};

const TEXT_PATTERNS = {
  email: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Enter a valid email address'],
  alpha: [/^[A-Za-z ]+$/, 'Use letters only'],
  alphanumeric: [/^[A-Za-z0-9 ]+$/, 'Use letters and numbers only'],
  url: [/^https?:\/\/\S+$/i, 'Enter a valid web address'],
};

const toDate = (raw) => {
  const text = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!text) return null;
  if (text === 'today' || text === 'now') return new Date();

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (date) => date.toLocaleDateString('en-IN');

const yearsBetween = (from, to) => {
  let years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  if (months < 0 || (months === 0 && to.getDate() < from.getDate())) years -= 1;
  return years;
};

/**
 * The number behind a typed value, or NaN if there isn't one.
 *
 * Commas and spaces come out first: `1,50,000` is how an amount is written
 * here, and `Number()` on its own reads that as NaN. `Number('')` is 0 rather
 * than NaN, which would make an empty box look like a legitimate zero, so the
 * empty case is answered explicitly.
 */
const toNumber = (text) => {
  const cleaned = String(text ?? '').replace(/[\s,]/g, '');
  return cleaned === '' ? NaN : Number(cleaned);
};

/**
 * What a numeric rule says when the value is not a number at all.
 *
 * The comparisons below used to return null in this case, which read as "no
 * complaint" and let `abc` clear a field whose only rule was a minimum: the
 * check bailed on exactly the input it existed to catch. A rule that cannot be
 * applied is a failure, not a pass.
 *
 * A field carrying its own `errorMessage` still wins over this, which is the
 * better outcome anyway -- "Enter a valid manufacturing year." beats a generic
 * line, and the caller already prefers it.
 */
const NOT_A_NUMBER = 'Enter a number';

const parseRange = (raw) => {
  const parts = String(raw ?? '')
    .split(/[-,|]/)
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry));
  return parts.length === 2 ? parts : null;
};

export function isFieldAnswered(field, value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return field.control === 'checkbox' ? value : true;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'object') return value !== null;
  return value !== null && value !== undefined;
}

export function isFieldRequired(field, requiredCodes) {
  if (field.required) return true;
  if (requiredCodes?.has?.(field.code)) return true;
  return (field.validations ?? []).some((entry) => RULE_ALIASES[slug(entry.rule)] === 'required');
}

function checkRule(name, ruleValue, value) {
  const limit = Number(ruleValue);

  if (Array.isArray(value)) {
    if (!Number.isFinite(limit)) return null;
    if (name === 'minLength' || name === 'min') {
      return value.length < limit ? `Pick at least ${limit}` : null;
    }
    if (name === 'maxLength' || name === 'max') {
      return value.length > limit ? `Pick no more than ${limit}` : null;
    }
    return null;
  }

  const text = typeof value === 'object' ? (value?.name ?? '') : String(value ?? '').trim();
  const compact = text.replace(/[\s-]/g, '');

  if (COMPACT_PATTERNS[name]) {
    const [pattern, message] = COMPACT_PATTERNS[name];
    return pattern.test(compact) ? null : message;
  }

  if (TEXT_PATTERNS[name]) {
    const [pattern, message] = TEXT_PATTERNS[name];
    return pattern.test(text) ? null : message;
  }

  switch (name) {
    case 'minLength':
      return Number.isFinite(limit) && text.length < limit
        ? `Use at least ${limit} characters`
        : null;

    case 'maxLength':
      return Number.isFinite(limit) && text.length > limit
        ? `Use no more than ${limit} characters`
        : null;

    case 'length':
      return Number.isFinite(limit) && text.length !== limit
        ? `Use exactly ${limit} characters`
        : null;

    case 'min': {
      if (!Number.isFinite(limit)) return null;
      const amount = toNumber(text);
      if (!Number.isFinite(amount)) return NOT_A_NUMBER;
      return amount < limit ? `Enter ${limit} or more` : null;
    }

    case 'max': {
      if (!Number.isFinite(limit)) return null;
      const amount = toNumber(text);
      if (!Number.isFinite(amount)) return NOT_A_NUMBER;
      return amount > limit ? `Enter ${limit} or less` : null;
    }

    case 'range': {
      const bounds = parseRange(ruleValue);
      if (!bounds) return null;
      const amount = toNumber(text);
      if (!Number.isFinite(amount)) return NOT_A_NUMBER;
      const [low, high] = bounds;
      return amount < low || amount > high ? `Enter a value between ${low} and ${high}` : null;
    }

    case 'pattern': {
      const source = String(ruleValue ?? '').trim();
      if (!source) return null;
      try {
        return new RegExp(source).test(text) ? null : 'Enter a valid value';
      } catch {
        return null;
      }
    }

    case 'minDate': {
      const boundary = toDate(ruleValue);
      const picked = toDate(text);
      if (!boundary || !picked) return null;
      return picked < boundary ? `Pick a date on or after ${formatDate(boundary)}` : null;
    }

    case 'maxDate': {
      const boundary = toDate(ruleValue);
      const picked = toDate(text);
      if (!boundary || !picked) return null;
      return picked > boundary ? `Pick a date on or before ${formatDate(boundary)}` : null;
    }

    case 'minAge': {
      const picked = toDate(text);
      if (!picked || !Number.isFinite(limit)) return null;
      return yearsBetween(picked, new Date()) < limit ? `Age must be at least ${limit}` : null;
    }

    case 'maxAge': {
      const picked = toDate(text);
      if (!picked || !Number.isFinite(limit)) return null;
      return yearsBetween(picked, new Date()) > limit ? `Age must be ${limit} or below` : null;
    }

    default:
      return null;
  }
}

export function validateField(field, value, requiredCodes = null) {
  if (isValuelessControl(field.control)) return null;

  const rules = field.validations ?? [];

  if (!isFieldAnswered(field, value)) {
    if (!isFieldRequired(field, requiredCodes)) return null;
    const declared = rules.find((entry) => RULE_ALIASES[slug(entry.rule)] === 'required');
    return declared?.message || `${field.label || 'This field'} is required`;
  }

  for (const entry of rules) {
    const name = RULE_ALIASES[slug(entry.rule)];
    if (!name || name === 'required') continue;

    const failure = checkRule(name, entry.value, value);
    if (failure) return entry.message || failure;
  }

  return null;
}

export function validateFields(fields = [], values = {}, requiredCodes = null) {
  const errors = {};

  for (const field of fields) {
    const message = validateField(field, values[field.code], requiredCodes);
    if (message) errors[field.code] = message;
  }

  return errors;
}
