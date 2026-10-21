import { z } from "zod";
import { parseDayMonthYear } from "@/shared/lib/format";

export const MIN_AGE = 18;

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
