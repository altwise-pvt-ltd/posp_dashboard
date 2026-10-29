// Folds metadata documents and add-ons into the section list as ordinary fields,
// so they render and validate like any other question.

import { resolveVisibleSections } from '@/shared/dynamic-form/lib/visibleSections';
import { humaniseCode } from './normalize';

export const DOCUMENTS_SECTION_CODE = 'DOCUMENTS';
export const ADD_ONS_SECTION_CODE = 'ADD_ONS';

// Field code for the amount an add-on asks for.
export const addOnValueCode = (code) => `${code}__VALUE`;

const SECTION_NAMES = {
  [DOCUMENTS_SECTION_CODE]: 'Documents',
  [ADD_ONS_SECTION_CODE]: 'Add-ons',
};

const sectionName = (code) => SECTION_NAMES[code] ?? humaniseCode(code);

// Shared shape for every form field, whether it came from fields, documents or add-ons.
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

// Turns a document's extension, size and count limits into validation rules.
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

// The add-on's amount as its own field; pruneAddOnValues uses addOnFor to drop it until the add-on is ticked.
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

// Published sections, then add-ons, then documents. A document whose sectionCode matches
// an existing section is appended to it, so no two sections share a code.
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

// Drops the amount field of every unticked add-on. Runs before directives, so an add-on
// hidden by a rule also drops its amount from validation.
export function pruneAddOnValues(sections = [], values = {}) {
  return sections.map((section) => {
    const fields = (section.fields ?? []).filter(
      (field) => !field.addOnFor || Boolean(values[field.addOnFor])
    );

    return fields.length === (section.fields ?? []).length ? section : { ...section, fields };
  });
}

// The visible sections, their fields and the required codes for these answers and rules.
export function resolveQuoteForm(baseSections, values, directives) {
  const sections = resolveVisibleSections(pruneAddOnValues(baseSections, values), directives);

  return {
    sections,
    fields: sections.flatMap((entry) => entry.fields),
    requiredCodes: new Set(directives?.requiredFields ?? []),
  };
}
