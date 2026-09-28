import { z } from "zod";

/**
 * The character rules for the app's three kinds of name field.
 *
 * Both anchor on a letter, which is what actually closes the hole QA found:
 * every one of these fields was `z.string().trim().min(1).max(200)`, so `12345`
 * and `@@@` were accepted as a person's name and stored as one.
 *
 * `\p{L}` rather than `A-Za-z` so a name written in an Indian script is a name
 * rather than an error. Digits are excluded from both — a PAN holder's name has
 * none, and neither does any Indian bank's.
 */
const PERSON_NAME = /^\p{L}[\p{L}\s.'-]*$/u;
const BANK_NAME = /^\p{L}[\p{L}\s.,&'()-]*$/u;
/**
 * An institution is the one kind that legitimately carries digits — "Kendriya
 * Vidyalaya No. 2", "D.A.V. Public School No. 5" — so they are allowed *inside*
 * the name while the leading `\p{L}` still refuses a value that is only digits.
 * That is the distinction QA's `999999 999999` was sitting in: the problem was
 * never the digits, it was that nothing anchored the name to a letter.
 */
const INSTITUTION_NAME = /^\p{L}[\p{L}\p{N}\s.,&'()/-]*$/u;

/**
 * The length every name field caps at, schema and input alike.
 *
 * Exported so an `<Input maxLength>` and the rule that rejects the same value
 * cannot drift: they used to be written out separately as 200, and lowering one
 * without the other is how you get a field that lets you type past the point it
 * will accept. 70 covers the longest real Indian names and institution names
 * with room to spare, and is short enough that the cap is reached by a stuck key
 * rather than by a person.
 */
export const NAME_MAX_LENGTH = 70;

/**
 * One name rule, built once for both shapes.
 *
 * Emptiness and shape are separated deliberately: an optional field left blank
 * has to pass, while the same field holding `12345` has to fail. A bare
 * `.regex()` cannot express that — it would reject `""` as a malformed name and
 * report "can only contain letters" to someone who typed nothing at all.
 */
function nameField({ pattern, hint, label, max, required }) {
  const field = z
    .string()
    .trim()
    .max(max, `${label} must be under ${max} characters.`)
    .superRefine((value, ctx) => {
      if (!value) {
        if (required) ctx.addIssue({ code: "custom", message: `${label} is required.` });
        return;
      }
      if (!pattern.test(value)) {
        ctx.addIssue({ code: "custom", message: `${label} ${hint}` });
      }
    });

  return required ? field : field.optional();
}

/** A person's name — PAN holder, Aadhaar holder, account holder. */
export function personNameField({ label = "Name", max = NAME_MAX_LENGTH, required = true } = {}) {
  return nameField({
    pattern: PERSON_NAME,
    hint: "can only contain letters, spaces, apostrophes, hyphens and full stops.",
    label,
    max,
    required,
  });
}

/** An institution's name — the bank, or one of its branches. */
export function bankNameField({ label = "Bank name", max = NAME_MAX_LENGTH, required = true } = {}) {
  return nameField({
    pattern: BANK_NAME,
    hint: "can only contain letters, spaces and & . , - ( ) — no digits.",
    label,
    max,
    required,
  });
}

/**
 * A school, college, board or university. Digits allowed after the first
 * letter — see `INSTITUTION_NAME`.
 */
export function institutionNameField({
  label = "Institution name",
  max = NAME_MAX_LENGTH,
  required = true,
} = {}) {
  return nameField({
    pattern: INSTITUTION_NAME,
    hint: "can only contain letters, digits, spaces and & . , - ( ) / — and must start with a letter.",
    label,
    max,
    required,
  });
}
