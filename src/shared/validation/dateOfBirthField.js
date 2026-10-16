import { z } from "zod";

export const MIN_AGE = 18;

/* `dd/mm/yyyy` → its { day, month, year } strings, or null when not in that shape. */
export function splitDayMonthYear(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? "");
  return match ? { day: match[1], month: match[2], year: match[3] } : null;
}

/* Strict dd/mm/yyyy → Date, or null when it isn't a real calendar day. The
   round-trip check is what rejects rollovers like 31/02/2000, which `new Date`
   would otherwise hand back as the 2nd of March. */
function parseDayMonthYear(value) {
  const parts = splitDayMonthYear(value);
  if (!parts) return null;

  const day = +parts.day;
  const month = +parts.month;
  const year = +parts.year;
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
