import { z } from "zod";

const MIN_AGE = 18;

/* Strict dd/mm/yyyy → Date, or null when it isn't a real calendar day. The
   round-trip check is what rejects rollovers like 31/02/2000, which `new Date`
   would otherwise hand back as the 2nd of March. */
function parseDayMonthYear(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || "");
  if (!match) return null;

  const day = +match[1];
  const month = +match[2];
  const year = +match[3];
  const date = new Date(year, month - 1, day);

  const real =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return real ? date : null;
}

/* POSP applicants must be adults — true once the same calendar day MIN_AGE
   years on has passed. */
function isOldEnough(date) {
  const adultOn = new Date(date.getFullYear() + MIN_AGE, date.getMonth(), date.getDate());
  return adultOn <= new Date();
}

export function formatDobInput(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function dateOfBirthField({ required = true, label = "Date of birth" } = {}) {
  return z
    .string()
    .trim()
    .optional()
    .superRefine((value, ctx) => {
      if (!value) {
        if (required) {
          ctx.addIssue({ code: "custom", message: `${label} is required.` });
        }
        return;
      }

      const date = parseDayMonthYear(value);
      if (!date || date > new Date()) {
        ctx.addIssue({ code: "custom", message: "Enter a valid date as dd/mm/yyyy." });
        return;
      }

      if (!isOldEnough(date)) {
        ctx.addIssue({ code: "custom", message: `You must be at least ${MIN_AGE} years old.` });
      }
    });
}
