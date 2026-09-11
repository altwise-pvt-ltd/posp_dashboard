import { api, unwrap, uploadConfig } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * What the multipart parts are called.
 *
 * ⚠ CONFIRM WITH BACKEND — a guess at the conventional shape, kept as two
 * constants so correcting it is a one-line edit rather than a hunt. The console
 * readout below prints both names on every upload, which is the fastest way to
 * settle it with whoever wrote the endpoint.
 */
const FILE_PART = 'file';
const CODE_PART = 'documentCode';

/**
 * Every file picked on the form, flattened into one upload queue.
 *
 * A string value is skipped: that is a document the server already holds and
 * handed back as a name, not something the user has just chosen. Only a real
 * `File` has bytes to send.
 */
export function pendingDocuments(fields = [], values = {}) {
  const queue = [];

  for (const field of fields) {
    if (field.control !== 'file') continue;

    const picked = values[field.code];
    const files = Array.isArray(picked) ? picked.filter(Boolean) : picked ? [picked] : [];

    for (const file of files) {
      if (typeof file === 'string') continue;
      queue.push({ code: field.code, label: field.label, file });
    }
  }

  return queue;
}

/** Identifies one file *on one quote*, so a re-save doesn't send it twice. */
export const documentKey = (quoteId, entry) =>
  `${quoteId}|${entry.code}|${entry.file?.name ?? ''}|${entry.file?.size ?? ''}`;

export async function uploadQuoteDocument({ quoteId, code, file, onProgress } = {}) {
  const url = ENDPOINTS.quotation.documents(quoteId);

  const body = new FormData();
  body.append(CODE_PART, code);
  body.append(FILE_PART, file, file.name);

  console.log(
    `[quote] Document → POST ${url}`,
    `parts: ${CODE_PART}="${code}", ${FILE_PART}=${file.name} (${Math.round(
      (file.size ?? 0) / 1024
    )} KB, ${file.type || 'unknown type'})`
  );

  try {
    const response = await api.post(url, body, uploadConfig({ onProgress }));
    const data = unwrap(response) ?? null;

    console.log(`[quote] Document accepted → ${code}`, data);

    return data;
  } catch (error) {
    console.error(
      `[quote] Document rejected → ${code}: ${error?.status ?? 'no status'} ${
        error?.message ?? error
      }`,
      error?.fieldErrors ?? error?.errors ?? ''
    );
    throw error;
  }
}
