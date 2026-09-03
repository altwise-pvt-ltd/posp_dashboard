import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

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

const normalizeDocument = (entry = {}) => ({
  code: entry.code ?? '',
  name: entry.name ?? '',
  required: Boolean(entry.isMandatory),
  allowedExtensions: entry.allowedExtensions ?? null,
  maxSizeMb: entry.maxSizeMb ?? null,
  displayOrder: entry.displayOrder ?? 0,
});

const normalizeAddOn = (entry = {}) => ({
  id: entry.id ?? null,
  code: entry.code ?? null,
  name: entry.name ?? '',
  description: entry.description ?? null,
  requiresValue: Boolean(entry.requiresValue),
  valueLabel: entry.valueLabel ?? null,
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

export async function fetchQuoteMetadata({ productId, subProductId, fileType } = {}) {
  const response = await api.get(ENDPOINTS.quotation.metadata, {
    params: {
      productId,
      subProductId: subProductId || undefined,
      fileType: fileType || undefined,
    },
  });

  const data = unwrap(response) ?? {};

  return {
    productId: data.productId ?? productId ?? null,
    subProductId: data.subProductId ?? subProductId ?? null,
    sections: (data.sections ?? []).map(normalizeSection).sort(byDisplayOrder),
    documents: (data.documents ?? []).map(normalizeDocument).sort(byDisplayOrder),
    addOns: (data.addOns ?? []).map(normalizeAddOn),
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
