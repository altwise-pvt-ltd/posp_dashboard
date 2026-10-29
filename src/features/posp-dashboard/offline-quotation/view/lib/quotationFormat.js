// Formatting for the quote queue and detail page.

import { daysUntil, formatCurrency, formatDate } from '@/shared/lib/format';

/** A quote's sum insured, or `—` when the server sent none. */
export const formatSumInsured = formatCurrency;

/** The selected offer's premium, or `—` when no offer is selected. */
export const formatPremium = formatCurrency;

/** "Motor · Two Wheeler" from line of business and product; `—` when both are missing. */
export const formatProduct = (row) =>
  [row?.lob, row?.product].filter(Boolean).join(' · ') || '—';

// A string with a non-midnight clock part, e.g. "2026-10-16T14:41:00".
const hasClockTime = (value) =>
  typeof value === 'string' && /T\d{2}:\d{2}/.test(value) && !/T00:00(:00(\.0+)?)?(Z|[+-]00:?00)?$/.test(value);

/** "16 Oct 2026, 2:41 pm", or just the date when the value has no time in it. */
export const formatDateTime = (value) => {
  const day = formatDate(value);
  if (day === '—' || !hasClockTime(value)) return day;

  const time = new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time}`;
};

/** True when the value parses as a date. */
export const hasDate = (value) => Boolean(value) && !Number.isNaN(new Date(value).getTime());

/** A quote's age in days as "today", "yesterday" or "13 days old"; null when invalid. */
export const formatAge = (days) => {
  if (!Number.isFinite(days) || days < 0) return null;
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';

  return `${days} days old`;
};

/**
 * Splits the first answer section off the form so the summary card can show its
 * entries inline. Only merged when that section holds a single row; its file
 * type entry is dropped, as the card already states the case type.
 */
export const splitLeadSection = (answers, quote) => {
  const [leadSection, ...laterSections] = answers?.sections ?? [];

  if (leadSection?.rows.length !== 1) {
    return { leadEntries: [], panelSections: answers?.sections ?? [] };
  }

  const caseType = String(quote?.fileType ?? '').toLowerCase();
  const sameAsCaseType = (entry) =>
    /file\s*type/i.test(entry.label) && String(entry.text).toLowerCase() === caseType;

  return {
    leadEntries: leadSection.rows[0].entries.filter((entry) => !sameAsCaseType(entry)),
    panelSections: laterSections,
  };
};

/**
 * "21 Oct" plus a relative note. `tone` is "warning" for today or tomorrow and
 * "expired" once past (no note then; the row shows an Expired pill).
 */
export const formatValidity = (value) => {
  if (!hasDate(value)) return { date: '—', left: null, tone: 'muted' };

  const date = new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const days = daysUntil(value);

  if (days < 0) return { date, left: null, tone: 'expired' };
  if (days === 0) return { date, left: 'Expires today', tone: 'warning' };
  if (days === 1) return { date, left: 'Expires tomorrow', tone: 'warning' };

  return { date, left: `${days} days left`, tone: 'muted' };
};
