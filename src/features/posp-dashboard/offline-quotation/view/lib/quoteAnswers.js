import { formatDate } from '@/shared/lib/format';

/**
 * The answers on a quote, read through the form they were given on.
 *
 * `GET /quote/<id>` returns `values: [{ fieldCode, rowIndex, value }]` — codes
 * and strings, with no labels and no order. `GET /quote/metadata` returns the
 * questions. This module is the join: it walks the metadata's sections in their
 * published order and pulls each field's answer out of the values list, so the
 * detail page reads as the filled-in form rather than a dump of field codes.
 *
 * Going through `buildQuoteSections` (the same function the create wizard
 * builds its screens from) rather than metadata's raw `sections` is what makes
 * add-ons and documents come out labelled too — they are folded in there as
 * ordinary fields, so `ZERO_DEP` arrives as a checkbox called "Zero
 * Depreciation" instead of falling out the bottom as an unrecognised code.
 */

/** `"true"` / `"false"` arrive as strings — every value in the list does. */
const BOOLEAN = { true: 'Yes', false: 'No' };

/** The label for one option value, or the value itself when there is no match. */
const optionText = (field, value) =>
  field.options?.find((option) => String(option.value) === String(value))?.text ?? value;

/**
 * One answer as something a person reads, or null when there is nothing to
 * read.
 *
 * Null and `''` both mean unanswered. They are not the same event — one field
 * was never sent, the other was sent empty — but they say the same thing to
 * someone reading the quote back, and a page of "—" is not a page.
 *
 * Values from a `lookupSource` field (MAKE, MODEL, VARIANT, RTO_CODE) come
 * through as the stored code, because their option lists arrive empty on the
 * metadata reply and are fetched per-field from `/quote/lookup` only once a
 * parent answer exists. Resolving them here would mean a request per field on
 * every quote opened; `KOENINSEGG_AGERA` is at least the value the quote
 * actually holds.
 */
export function answerText(field, raw) {
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

    case 'date':
      return formatDate(value);

    case 'number': {
      const shown = groupDigits(value);
      return field.unit ? `${shown} ${field.unit}` : shown;
    }

    default:
      return field.unit ? `${value} ${field.unit}` : value;
  }
}

/**
 * Indian digit grouping, but only once a number is long enough to need it.
 *
 * The threshold is what stops `MFG_YEAR` rendering as "2,020". Years, PIN
 * codes, CC figures and NCB percentages all come through the same `number`
 * control as a sum insured does, and nothing on the field says which is which —
 * so the number itself decides: five digits or more is a quantity worth
 * grouping, four or fewer is almost always an identifier or a small count.
 *
 * The cost is that a four-digit amount reads "9500" rather than "9,500". That
 * is plain where the other is wrong, which is the right way round.
 */
const groupDigits = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;

  return Math.abs(parsed) >= 10000 ? parsed.toLocaleString('en-IN') : String(parsed);
};

/**
 * What an answer looks like when there is no field to describe it.
 *
 * Only one inference is made: every value in this API is a string, booleans
 * included, so `"true"` is read as a tick-box. That one is unambiguous and it
 * is the difference between "Zero Dep: Yes" and "Zero Dep: true".
 *
 * Digits are deliberately *not* inferred as a quantity. A bare run of digits
 * here is as likely to be a mobile number, an Aadhaar or a PIN as an amount,
 * and grouping one of those produces "8,45,91,32,835" — visibly wrong, where
 * an ungrouped amount is merely plain. With no field to say which it is, the
 * value is left exactly as stored.
 *
 * Inferring at all is only safe here. A real text field whose answer happens to
 * be the word "true" keeps it, because that field says what it is.
 */
const inferField = (value) => {
  const raw = String(value).trim().toLowerCase();

  return raw === 'true' || raw === 'false'
    ? { control: 'checkbox', options: [] }
    : { control: 'text', options: [] };
};

/** `PASSENGER_COVER__VALUE` → "Passenger Cover Value", for a code with no field. */
export const humaniseCode = (code) =>
  String(code ?? '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

/**
 * Index the answers by field, then by row.
 *
 * Two levels because a repeatable section stores its second entry under
 * `rowIndex: 1`. Flattening to one answer per code would render the first and
 * lose the rest without saying so.
 */
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
 * The view model the detail page renders.
 *
 *   sections — only those with at least one answer, in metadata order, each
 *              holding one `row` per `rowIndex` that carried anything
 *   orphans  — answers whose field code is in no section at all
 *   blanks   — how many questions were asked and left empty
 *
 * `orphans` is not a defensive flourish. The metadata is fetched for the
 * product *as it is published today*, and the quote was answered against it as
 * it stood whenever it was raised — a question since removed still has its
 * answer stored, and dropping it silently would quietly rewrite what the agent
 * submitted. `blanks` is counted for the same reason, so the page can say how
 * much it is not showing.
 */
export function buildAnswerView(sections = [], values = []) {
  const byField = indexValues(values);
  const claimed = new Set();
  let blanks = 0;

  const answered = [];

  for (const section of sections) {
    const fields = section.fields ?? [];

    // Which rows this section actually has answers for. Almost always just
    // row 0; a repeatable section is the reason this is a set.
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

        const text = answerText(field, byField.get(field.code).get(index));
        if (text === null) {
          if (index === 0) blanks += 1;
          continue;
        }

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
      if (text === null) blanks += 1;
      else orphans.push({ code, label: humaniseCode(code), text });
    }
  }

  return { sections: answered, orphans, blanks };
}
