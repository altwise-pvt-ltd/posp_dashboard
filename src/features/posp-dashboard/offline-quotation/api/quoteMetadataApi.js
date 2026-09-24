import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { DOCUMENTS_SECTION_CODE } from '../lib/quoteSections';

const CONTROL_ALIASES = {
  text: 'text',
  textbox: 'text',
  input: 'text',
  string: 'text',
  email: 'text',
  phone: 'text',
  tel: 'text',
  mobile: 'text',

  textarea: 'textarea',
  multiline: 'textarea',

  number: 'number',
  numeric: 'number',
  decimal: 'number',
  integer: 'number',
  int: 'number',
  currency: 'number',
  amount: 'number',

  date: 'date',
  datepicker: 'date',
  datetime: 'date',

  select: 'select',
  dropdown: 'select',
  combobox: 'select',
  autocomplete: 'select',
  lookup: 'select',

  radio: 'radio',
  radiobutton: 'radio',
  radiogroup: 'radio',
  radiolist: 'radio',

  checkbox: 'checkbox',
  check: 'checkbox',

  multiselect: 'multiselect',
  multiselectlist: 'multiselect',
  checkboxlist: 'multiselect',
  tags: 'multiselect',

  file: 'file',
  fileupload: 'file',
  upload: 'file',
  document: 'file',
  image: 'file',

  toggle: 'toggle',
  switch: 'toggle',
  boolean: 'toggle',

  label: 'label',
  heading: 'label',
  header: 'label',
  static: 'label',
  info: 'label',
  note: 'label',
};

const DATA_TYPE_CONTROLS = {
  lookup: 'select',
  number: 'number',
  decimal: 'number',
  integer: 'number',
  int: 'number',
  date: 'date',
  datetime: 'date',
  bool: 'checkbox',
  boolean: 'checkbox',
  file: 'file',
};

const slug = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

function resolveControl(entry) {
  return (
    CONTROL_ALIASES[slug(entry.controlType)] ?? DATA_TYPE_CONTROLS[slug(entry.dataType)] ?? 'text'
  );
}

const normalizeOption = (entry = {}) => ({
  value: entry.value ?? '',
  text: entry.text ?? entry.value ?? '',
});

const normalizeValidation = (entry = {}) => ({
  rule: entry.ruleType ?? '',
  value: entry.ruleValue ?? null,
  message: entry.errorMessage ?? '',
});

const normalizeField = (entry = {}) => ({
  code: entry.fieldCode ?? '',
  label: entry.label ?? '',
  control: resolveControl(entry),
  controlType: entry.controlType ?? null,
  dataType: entry.dataType ?? null,
  required: Boolean(entry.isMandatory),
  placeholder: entry.placeholder ?? null,
  helperText: entry.helperText ?? null,
  unit: entry.unit ?? null,
  defaultValue: entry.defaultValue ?? null,
  lookupSource: entry.lookupSource ?? null,
  dependsOn: entry.dependsOnFieldCode ?? null,
  options: (entry.options ?? []).map(normalizeOption),
  validations: (entry.validations ?? []).map(normalizeValidation),
});

const normalizeSection = (entry = {}) => ({
  code: entry.code ?? '',
  name: entry.name ?? '',
  displayOrder: entry.displayOrder ?? 0,
  collapsible: Boolean(entry.isCollapsible),
  repeatable: Boolean(entry.isRepeatable),
  fields: (entry.fields ?? []).map(normalizeField),
});

/**
 * A count the server may not send at all. Anything that isn't a positive number
 * -- `null`, `0`, `"many"` -- means one file, which is what every document asked
 * for one attachment before `maxCount` existed.
 */
const toCount = (raw) => {
  const count = Number(raw);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
};

/**
 * Documents and add-ons carry a `controlType` of their own, so both resolve
 * through the same table the fields do. The `dataType` fallbacks below only
 * decide what an *older* payload -- one with no `controlType` -- renders as, and
 * a document is a file and an add-on a checkbox in every such payload.
 */
const normalizeDocument = (entry = {}) => ({
  code: entry.code ?? '',
  name: entry.name ?? '',
  required: Boolean(entry.isMandatory),
  allowedExtensions: entry.allowedExtensions ?? null,
  maxSizeMb: entry.maxSizeMb ?? null,
  displayOrder: entry.displayOrder ?? 0,
  control: resolveControl({ ...entry, dataType: entry.dataType ?? 'file' }),
  controlType: entry.controlType ?? null,
  maxCount: toCount(entry.maxCount),
  sectionCode: entry.sectionCode || DOCUMENTS_SECTION_CODE,
});

const normalizeAddOn = (entry = {}) => ({
  id: entry.id ?? null,
  code: entry.code ?? null,
  name: entry.name ?? '',
  description: entry.description ?? null,
  requiresValue: Boolean(entry.requiresValue),
  valueLabel: entry.valueLabel ?? null,
  displayOrder: entry.displayOrder ?? 0,
  control: resolveControl({ ...entry, dataType: entry.dataType ?? 'bool' }),
  controlType: entry.controlType ?? null,
});

export const normalizeDirectives = (entry = {}) => ({
  hiddenSections: entry?.hiddenSections ?? [],
  hiddenFields: entry?.hiddenFields ?? [],
  requiredFields: entry?.requiredFields ?? [],
  disabledFields: entry?.disabledFields ?? [],
  setValues: entry?.setValues ?? {},
  inspectionRequired: Boolean(entry?.inspectionRequired),
});

const byDisplayOrder = (a, b) => a.displayOrder - b.displayOrder;

export async function fetchQuoteMetadata({ productId, subProductId, fileType, signal } = {}) {
  const response = await api.get(ENDPOINTS.quotation.metadata, {
    params: {
      productId,
      subProductId: subProductId || undefined,
      fileType: fileType || undefined,
    },
    /* Optional, and only passed by callers that can be unmounted mid-flight --
       the quote detail screen fetches this as the second half of a pair and has
       to be able to abandon both. */
    signal,
  });

  const data = unwrap(response) ?? {};

  return {
    productId: data.productId ?? productId ?? null,
    subProductId: data.subProductId ?? subProductId ?? null,
    sections: (data.sections ?? []).map(normalizeSection).sort(byDisplayOrder),
    documents: (data.documents ?? []).map(normalizeDocument).sort(byDisplayOrder),
    addOns: (data.addOns ?? []).map(normalizeAddOn).sort(byDisplayOrder),
    directives: normalizeDirectives(data.directives),
  };
}

export async function fetchLookupOptions({ source, parent } = {}) {
  const response = await api.get(ENDPOINTS.quotation.lookup, {
    params: { source, parent: parent || undefined },
  });

  const data = unwrap(response);
  return Array.isArray(data) ? data.map(normalizeOption) : [];
}
