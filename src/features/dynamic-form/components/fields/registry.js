import CustomInput from './CustomInput';
import CustomTextarea from './CustomTextarea';
import CustomNumber from './CustomNumber';
import CustomDate from './CustomDate';
import CustomSelect from './CustomSelect';
import CustomRadio from './CustomRadio';
import CustomCheckbox from './CustomCheckbox';
import CustomMultiSelect from './CustomMultiSelect';
import CustomFile from './CustomFile';
import CustomToggle from './CustomToggle';
import CustomLabel from './CustomLabel';

export const FIELD_COMPONENTS = {
  text: CustomInput,
  textarea: CustomTextarea,
  number: CustomNumber,
  date: CustomDate,
  select: CustomSelect,
  radio: CustomRadio,
  checkbox: CustomCheckbox,
  multiselect: CustomMultiSelect,
  file: CustomFile,
  toggle: CustomToggle,
  label: CustomLabel,
};

export const VALUELESS_CONTROLS = new Set(['label']);

export function getFieldComponent(control) {
  return FIELD_COMPONENTS[control] ?? CustomInput;
}

export function isValuelessControl(control) {
  return VALUELESS_CONTROLS.has(control);
}
