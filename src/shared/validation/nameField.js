import { z } from "zod";

/**
 * The character rules for the app's two kinds of name field.
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
export function personNameField({ label = "Name", max = 200, required = true } = {}) {
  return nameField({
    pattern: PERSON_NAME,
    hint: "can only contain letters, spaces, apostrophes, hyphens and full stops.",
    label,
    max,
    required,
  });
}

/** An institution's name — the bank, or one of its branches. */
export function bankNameField({ label = "Bank name", max = 200, required = true } = {}) {
  return nameField({
    pattern: BANK_NAME,
    hint: "can only contain letters, spaces and & . , - ( ) — no digits.",
    label,
    max,
    required,
  });
}
