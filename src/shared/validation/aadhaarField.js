import { z } from "zod";

const digitsOf = (value) => String(value ?? "").replace(/\D/g, "");

/** Twelve bare digits — what the server stores and what every rule tests. */
export const stripAadhaar = digitsOf;

/**
 * Progressive grouping for the input mask: `3390 3781 1193` as it is typed.
 * Partial input is grouped too, which is why this is not the display formatter.
 */
export const formatAadhaarInput = (raw) =>
  digitsOf(raw).slice(0, 12).replace(/(.{4})/g, "$1 ").trim();

/**
 * Display grouping for a value already on file.
 *
 * Only a full twelve digits is regrouped. `/posp/me` may hand back a masked
 * number (`XXXX XXXX 1193`) or a shorter reference, and reformatting those
 * would be rewriting something this app doesn't understand — so anything else
 * prints exactly as it arrived.
 */
export const formatAadhaar = (value) => {
  const digits = digitsOf(value);
  return digits.length === 12
    ? digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")
    : String(value ?? "");
};

/** The form field. Spaces are ignored, so it accepts either grouping. */
export function aadhaarField({ message = "Aadhaar must be 12 digits." } = {}) {
  return z.string().refine((value) => digitsOf(value).length === 12, message);
}
