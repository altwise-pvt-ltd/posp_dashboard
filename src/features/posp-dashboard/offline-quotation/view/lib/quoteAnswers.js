import { formatDate } from '@/shared/lib/format';
import { humaniseCode } from '@/features/posp-dashboard/offline-quotation/lib/normalize';

// Joins a quote's stored values ({ fieldCode, rowIndex, value }) with the form sections,
// so answers get labels and appear in form order.

/** Every stored value is a string, booleans included. */
const BOOLEAN = { true: 'Yes', false: 'No' };

/** The label for one option value, or the value itself when there is no match. */
const optionText = (field, value) =>
  field.options?.find((option) => String(option.value) === String(value))?.text ?? value;

/**
 * One answer as display text, or null when blank. Lookup fields (MAKE, MODEL, ...) show
 * the stored code, since their options are only fetched per field from `/quote/lookup`.
 */
function answerText(field, raw) {
  if (raw === null || raw === undefined) return null;

  const value = typeof raw === 'string' ? raw.trim() : String(raw);
  if (!value) return null;

  switch (field.control) {
    case 'checkbox':
    case 'toggle':
      return BOOLEAN[value.toLowerCase()] ?? value;

    case 'select':
    case 'radio':
      return optionText(field, value);

    case 'multiselect':
      return value
        .split(',')
        .map((entry) => optionText(field, entry.trim()))
        .filter(Boolean)
        .join(', ');

    case 'date': {
      const shown = formatDate(value);
      return shown === '—' ? null : shown;
    }

    case 'number': {
      const shown = groupDigits(value);
      return field.unit ? `${shown} ${field.unit}` : shown;
    }

    default:
      return field.unit ? `${value} ${field.unit}` : value;
  }
}

/** Indian digit grouping from five digits up, so years and short codes stay ungrouped. */
const groupDigits = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;

  return Math.abs(parsed) >= 10000 ? parsed.toLocaleString('en-IN') : String(parsed);
};

/** A stand-in field for an answer with no metadata: "true"/"false" as a checkbox, else plain text. */
const inferField = (value) => {
  const raw = String(value).trim().toLowerCase();

  return raw === 'true' || raw === 'false'
    ? { control: 'checkbox', options: [] }
    : { control: 'text', options: [] };
};

/** Indexes answers by field code, then by rowIndex (repeatable sections use rows above 0). */
const indexValues = (values = []) => {
  const byField = new Map();

  for (const entry of values) {
    if (!entry?.fieldCode) continue;
    if (!byField.has(entry.fieldCode)) byField.set(entry.fieldCode, new Map());
    byField.get(entry.fieldCode).set(entry.rowIndex ?? 0, entry.value);
  }

  return byField;
};

/**
 * Answered sections in metadata order (one row per rowIndex), plus orphans: answers
 * whose field is no longer in the metadata. Blank answers are skipped.
 */
export function buildAnswerView(sections = [], values = []) {
  const byField = indexValues(values);
  const claimed = new Set();

  const answered = [];

  for (const section of sections) {
    const fields = section.fields ?? [];

    // Row indexes this section has answers for.
    const indexes = new Set();
    for (const field of fields) {
      for (const index of byField.get(field.code)?.keys() ?? []) indexes.add(index);
    }

    const rows = [];

    for (const index of [...indexes].sort((a, b) => a - b)) {
      const entries = [];

      for (const field of fields) {
        if (!byField.has(field.code)) continue;
        claimed.add(field.code);

        // File answers are skipped; documents are listed separately.
        if (field.control === 'file') continue;

        const text = answerText(field, byField.get(field.code).get(index));
        if (text === null) continue;

        entries.push({ code: field.code, label: field.label || humaniseCode(field.code), text });
      }

      if (entries.length > 0) rows.push({ index, entries });
    }

    if (rows.length > 0) {
      answered.push({ code: section.code, name: section.name, repeatable: section.repeatable, rows });
    }
  }

  const orphans = [];

  for (const [code, rows] of byField) {
    if (claimed.has(code)) continue;

    for (const [, raw] of rows) {
      const text = answerText(inferField(raw), raw);
      if (text !== null) orphans.push({ code, label: humaniseCode(code), text });
    }
  }

  return { sections: answered, orphans };
}

/**
 * Stored answers (row 0 only) turned back into form values for editing: checkboxes to
 * booleans, multiselects to arrays. File fields come from `storedDocumentValues`.
 */
export function storedFormValues(sections = [], values = []) {
  const byField = indexValues(values);
  const seeded = {};

  for (const section of sections) {
    for (const field of section.fields ?? []) {
      if (field.control === 'file' || !byField.has(field.code)) continue;

      const raw = byField.get(field.code).get(0);
      if (raw === null || raw === undefined) continue;

      const value = String(raw);

      switch (field.control) {
        case 'checkbox':
        case 'toggle':
          seeded[field.code] = value.trim().toLowerCase() === 'true';
          break;

        // Map each entry back to the option's own value, which may be a number.
        case 'multiselect':
          seeded[field.code] = value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map(
              (entry) =>
                field.options?.find((option) => String(option.value) === entry)?.value ?? entry
            );
          break;

        default:
          seeded[field.code] = value;
      }
    }
  }

  return seeded;
}

/**
 * The quote's uploaded documents as file-field values, by file name, plus the
 * documents placed. A field taking one file gets the latest upload; one taking
 * several gets them all.
 */
export function storedDocumentValues(sections = [], documents = []) {
  const values = {};
  const placed = [];
  const byUpload = [...documents].sort((a, b) =>
    String(a.uploadedAt ?? '').localeCompare(String(b.uploadedAt ?? ''))
  );

  for (const section of sections) {
    for (const field of section.fields ?? []) {
      if (field.control !== 'file') continue;

      const docs = byUpload.filter((doc) => doc.code === field.code);
      if (docs.length === 0) continue;

      const kept = (field.maxCount ?? 1) > 1 ? docs : docs.slice(-1);
      const names = kept.map((doc) => doc.fileName);

      values[field.code] = (field.maxCount ?? 1) > 1 ? names : names[0];
      placed.push(...kept);
    }
  }

  return { values, documents: placed };
}
