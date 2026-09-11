/**
 * `documents` and `addOns` arrive beside `sections` on the metadata reply, in
 * shapes of their own -- but each entry now carries a `controlType`, which is
 * the one thing the dynamic-form registry ever needed to dispatch on.
 *
 * So neither gets a bespoke screen. Both are folded into the section list as
 * ordinary fields, and from there they render, validate, step and post exactly
 * like every other question. The cost of a new control type on either of them
 * is zero: the registry already answers for it.
 *
 * What is *not* built here is the upload itself. A picked file lives in form
 * state like any other answer and goes nowhere -- `/quote/documents` stays
 * unwired, deliberately, along with submit.
 */

export const DOCUMENTS_SECTION_CODE = 'DOCUMENTS';
export const ADD_ONS_SECTION_CODE = 'ADD_ONS';

/** The amount that rides along with an add-on the server wants a value for. */
export const addOnValueCode = (code) => `${code}__VALUE`;

const SECTION_NAMES = {
  [DOCUMENTS_SECTION_CODE]: 'Documents',
  [ADD_ONS_SECTION_CODE]: 'Add-ons',
};

const titleCase = (code) =>
  String(code ?? '')
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const sectionName = (code) => SECTION_NAMES[code] ?? titleCase(code);

/**
 * Every field the form renders is this shape, whether it came from `fields`,
 * `documents` or `addOns`. Building the extras through one factory keeps them
 * from drifting: a renderer reading `helperText` or `options` off a document
 * finds the same key it finds on a field.
 */
const makeField = (entry) => ({
  code: '',
  label: '',
  control: 'text',
  controlType: null,
  dataType: null,
  required: false,
  placeholder: null,
  helperText: null,
  unit: null,
  defaultValue: null,
  lookupSource: null,
  dependsOn: null,
  options: [],
  validations: [],
  ...entry,
});

const extensionList = (raw) =>
  String(raw ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const documentHint = (doc) => {
  const parts = [];
  const extensions = extensionList(doc.allowedExtensions);

  if (extensions.length > 0) parts.push(extensions.join(', '));
  if (doc.maxSizeMb) parts.push(`up to ${doc.maxSizeMb} MB`);
  if (doc.maxCount > 1) parts.push(`${doc.maxCount} files max`);

  return parts.length > 0 ? parts.join(' · ') : null;
};

/**
 * `allowedExtensions` and `maxSizeMb` are rules the server states in its own
 * words; restating them as `validations` entries hands them to the same
 * validator every other rule goes through, rather than growing a second place
 * where a field can be found wanting.
 */
const documentValidations = (doc) => {
  const rules = [];

  if (doc.allowedExtensions) {
    rules.push({
      rule: 'fileTypes',
      value: doc.allowedExtensions,
      message: '',
    });
  }
  if (doc.maxSizeMb) {
    rules.push({ rule: 'maxFileSize', value: doc.maxSizeMb, message: '' });
  }
  if (doc.maxCount > 1) {
    rules.push({ rule: 'maxCount', value: doc.maxCount, message: '' });
  }

  return rules;
};

const documentField = (doc) =>
  makeField({
    code: doc.code,
    label: doc.name,
    control: doc.control || 'file',
    controlType: doc.controlType ?? null,
    required: doc.required,
    helperText: documentHint(doc),
    accept: doc.allowedExtensions ?? null,
    maxCount: doc.maxCount ?? 1,
    validations: documentValidations(doc),
  });

const addOnField = (addOn) =>
  makeField({
    code: addOn.code,
    label: addOn.name,
    control: addOn.control || 'checkbox',
    controlType: addOn.controlType ?? null,
    helperText: addOn.description,
  });

/**
 * The amount an add-on asks for is a field in its own right rather than a prop
 * on the checkbox, so it validates and reports errors like anything else. It is
 * marked with `addOnFor`, which is what `pruneAddOnValues` reads to keep it off
 * the screen until the add-on above it is ticked.
 */
const addOnValueField = (addOn) =>
  makeField({
    code: addOnValueCode(addOn.code),
    label: addOn.valueLabel || `${addOn.name} value`,
    control: 'number',
    required: true,
    addOnFor: addOn.code,
    validations: [{ rule: 'min', value: 1, message: 'Enter the amount for this add-on' }],
  });

const makeSection = (code, fields, displayOrder) => ({
  code,
  name: sectionName(code),
  displayOrder,
  collapsible: false,
  repeatable: false,
  fields,
});

/**
 * The full section list the quote form works from: the published sections, then
 * add-ons, then documents.
 *
 * A document names the section it belongs to. When that names a section the
 * product already publishes, its fields are appended to it rather than opening
 * a second screen under the same code -- two sections sharing a code would
 * collide as React keys and read as a duplicated heading.
 */
export function buildQuoteSections(metadata) {
  const sections = (metadata?.sections ?? []).map((section) => ({
    ...section,
    fields: [...(section.fields ?? [])],
  }));

  const addOns = (metadata?.addOns ?? []).filter((addOn) => addOn.code);

  if (addOns.length > 0) {
    const fields = addOns.flatMap((addOn) =>
      addOn.requiresValue ? [addOnField(addOn), addOnValueField(addOn)] : [addOnField(addOn)]
    );
    sections.push(makeSection(ADD_ONS_SECTION_CODE, fields, sections.length));
  }

  const groups = new Map();

  for (const doc of metadata?.documents ?? []) {
    if (!doc.code) continue;
    const code = doc.sectionCode || DOCUMENTS_SECTION_CODE;
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(documentField(doc));
  }

  for (const [code, fields] of groups) {
    const existing = sections.find((section) => section.code === code);
    if (existing) existing.fields.push(...fields);
    else sections.push(makeSection(code, fields, sections.length));
  }

  return sections;
}

/**
 * Drops the amount field of every add-on that is not ticked. It runs before the
 * directives are applied, so an add-on hidden by a rule takes its amount off
 * the screen with it -- and off the validation sweep, which walks the visible
 * fields only.
 */
export function pruneAddOnValues(sections = [], values = {}) {
  return sections.map((section) => {
    const fields = (section.fields ?? []).filter(
      (field) => !field.addOnFor || Boolean(values[field.addOnFor])
    );

    return fields.length === (section.fields ?? []).length ? section : { ...section, fields };
  });
}
