/**
 * Character masks for react-hook-form text inputs.
 *
 * Every masked field in the wizard was the same three lines — register, rewrite
 * `e.target.value`, forward to RHF's own `onChange` — repeated once per field
 * across four steps. `maskedField` is that shape once; the masks below are the
 * variants it is called with.
 */

export const digitMask = (max) => (value) =>
  String(value ?? "").replace(/\D/g, "").slice(0, max);

export const upperAlnumMask = (max) => (value) =>
  String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, max);

/**
 * `form.register(name)` with the typed value rewritten on the way through.
 *
 * The mask runs before RHF reads the event, so what the form holds and what the
 * input shows are always the same string — spread it in place of `register`.
 */
export function maskedField(form, name, mask) {
  const field = form.register(name);

  return {
    ...field,
    onChange: (event) => {
      event.target.value = mask(event.target.value);
      return field.onChange(event);
    },
  };
}
