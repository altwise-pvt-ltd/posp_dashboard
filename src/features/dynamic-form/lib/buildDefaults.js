import { isValuelessControl } from '../components/fields/registry';

const TRUTHY = ['true', '1', 'yes', 'y', 'on'];

function defaultFor(field) {
  const raw = field.defaultValue;

  if (field.control === 'checkbox' || field.control === 'toggle') {
    return raw === null || raw === undefined ? false : TRUTHY.includes(String(raw).toLowerCase());
  }

  if (field.control === 'multiselect') {
    if (Array.isArray(raw)) return raw;
    if (raw === null || raw === undefined || raw === '') return [];
    return String(raw)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (field.control === 'file') return null;

  return raw ?? '';
}

export function buildDefaults(sections = [], setValues = null) {
  const values = {};

  for (const section of sections) {
    for (const field of section.fields ?? []) {
      if (isValuelessControl(field.control)) continue;
      values[field.code] = defaultFor(field);
    }
  }

  for (const [code, value] of Object.entries(setValues ?? {})) {
    if (code in values) values[code] = value;
  }

  return values;
}
