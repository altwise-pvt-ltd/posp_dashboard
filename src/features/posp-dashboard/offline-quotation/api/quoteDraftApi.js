import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { isValuelessControl } from '@/features/dynamic-form/components/fields/registry';

/**
 * One answer in the shape `POST /quote/draft` takes it: a string, or `null` for
 * an answer that cannot be written as one.
 *
 * Empty is still an answer here, unlike `rules/evaluate` where a blank is
 * simply left out. A draft is a snapshot of the form as it stands, so a field
 * the user cleared has to travel as `''` -- omitting it would leave whatever
 * was stored last time looking like the current answer.
 */
const toDraftValue = (value) => {
  if (Array.isArray(value)) {
    const parts = value.filter(
      (entry) => entry !== null && entry !== undefined && entry !== '' && typeof entry !== 'object'
    );
    return parts.join(',');
  }

  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return null;

  return String(value);
};

/**
 * The visible answers as a list of `{ fieldCode, value }` pairs.
 *
 * Built from the *fields* rather than from the values map, so what is saved is
 * what the form is actually asking: an answer to a question a rule has since
 * hidden is no longer part of this quote and has no business in the draft.
 *
 * Attachments drop out here. A `File` has nowhere to go in a list of strings
 * and the upload endpoint is not wired, so a document field contributes
 * nothing rather than an entry saying `[object File]`.
 */
export function buildDraftValues(fields = [], values = {}) {
  const list = [];

  for (const field of fields) {
    if (field.control === 'file' || isValuelessControl(field.control)) continue;

    const value = toDraftValue(values[field.code]);
    if (value === null) continue;

    list.push({ fieldCode: field.code, value });
  }

  return list;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isObject = (data) => Boolean(data) && typeof data === 'object' && !Array.isArray(data);

/**
 * What to *show* for the draft just stored: `QT-2026-000008`, the number a
 * human quotes down the phone. None of these keys being present is fine -- the
 * save is confirmed by the 200, not by getting a reference back.
 */
const draftReference = (data) => {
  if (!isObject(data)) return null;
  return data.quoteNumber ?? data.draftNumber ?? data.reference ?? null;
};

/**
 * What to *address* the draft by: the uuid that goes in
 * `/quote/<quoteId>/documents`. A different thing from the reference above and
 * not interchangeable with it — the documents route takes the uuid and nothing
 * else.
 *
 * The named keys are checked first; failing those, any uuid-shaped value on the
 * reply will do. That fallback is here because the key this arrives under isn't
 * pinned down yet, and an upload that can't find its id fails in a way nobody
 * would guess from the symptom.
 */
const draftId = (data) => {
  if (!isObject(data)) return null;

  const named = data.quoteId ?? data.id ?? data.draftId;
  if (typeof named === 'string' && named) return named;

  const found = Object.values(data).find((value) => typeof value === 'string' && UUID.test(value));
  return found ?? null;
};

/**
 * The draft printed to the console, for checking against what the backend
 * expects before either side commits to a shape.
 *
 * It prints the body *as posted* rather than a tidied version of it — the point
 * is to see the real thing, `''` for a blank and `'false'` for an unticked box
 * included. Attachments get their own list precisely because they are missing
 * from the payload: an absence nobody mentions is the kind of thing two teams
 * discover a fortnight later.
 *
 * ⚠ Verification aid, not instrumentation. It prints whatever the agent typed,
 * customer details and all, into the browser console of whichever environment
 * it runs in — worth removing, or gating behind `import.meta.env.DEV`, once the
 * payload is agreed.
 */
function logDraft(body, fields = [], values = {}) {
  const posted = new Map(body.values.map((entry) => [entry.fieldCode, entry.value]));

  const answers = fields
    .filter((field) => posted.has(field.code))
    .map((field) => ({
      question: field.label,
      fieldCode: field.code,
      control: field.control,
      value: posted.get(field.code),
    }));

  const attachments = fields
    .filter((field) => field.control === 'file')
    .flatMap((field) => {
      const picked = values[field.code];
      const list = Array.isArray(picked) ? picked : picked ? [picked] : [];

      return list.map((file) => ({
        question: field.label,
        fieldCode: field.code,
        file: file?.name ?? String(file),
        kb: Number.isFinite(file?.size) ? Math.round(file.size / 1024) : null,
      }));
    });

  console.group(`[quote] Draft → POST ${ENDPOINTS.quotation.draft}`);
  console.log('Body as posted:', body);
  console.log(`Copy for the backend team:
${JSON.stringify(body, null, 2)}`);
  console.table(answers);

  if (attachments.length > 0) {
    console.log(
      `${attachments.length} attachment(s) picked on the form and NOT in this payload — a draft is the answers only until an upload endpoint exists:`
    );
    console.table(attachments);
  }

  console.groupEnd();
}

export async function saveQuoteDraft({ productId, subProductId, fields, values } = {}) {
  const body = {
    productId,
    subProductId: subProductId || null,
    values: buildDraftValues(fields, values),
  };

  logDraft(body, fields, values);

  try {
    const response = await api.post(ENDPOINTS.quotation.draft, body);
    const data = unwrap(response);

    console.log('[quote] Draft accepted →', data);

    return { id: draftId(data), reference: draftReference(data), data: data ?? null };
  } catch (error) {
    console.error(
      `[quote] Draft rejected → ${error?.status ?? 'no status'}: ${error?.message ?? error}`,
      error?.fieldErrors ?? error?.errors ?? ''
    );
    throw error;
  }
}
