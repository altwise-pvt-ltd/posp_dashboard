import { api, unwrap, uploadConfig } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

// ⚠ Unconfirmed with backend: the multipart part names `file` and `documentCode`.
const FILE_PART = 'file';
const CODE_PART = 'documentCode';

// Files rebuilt from documents the quote already holds; never uploaded again.
const storedFiles = new WeakSet();

/** A document the server holds, as a `File` the form can preview. */
export function storedDocumentFile(blob, doc) {
  const file = new File([blob], doc.fileName, { type: doc.contentType || blob.type });
  storedFiles.add(file);
  return file;
}

// Newly picked files on the form as one upload queue; files the server already holds are skipped.
export function pendingDocuments(fields = [], values = {}) {
  const queue = [];

  for (const field of fields) {
    if (field.control !== 'file') continue;

    const picked = values[field.code];
    const files = Array.isArray(picked) ? picked.filter(Boolean) : picked ? [picked] : [];

    for (const file of files) {
      if (!(file instanceof File) || storedFiles.has(file)) continue;
      queue.push({ code: field.code, label: field.label, file });
    }
  }

  return queue;
}

// Identifies one file on one quote, so a re-save doesn't upload it twice.
export const documentKey = (quoteId, entry) =>
  `${quoteId}|${entry.code}|${entry.file?.name ?? ''}|${entry.file?.size ?? ''}`;

export async function uploadQuoteDocument({ quoteId, code, file, onProgress } = {}) {
  const url = ENDPOINTS.quotation.documents(quoteId);

  const body = new FormData();
  body.append(CODE_PART, code);
  body.append(FILE_PART, file, file.name);

  const response = await api.post(url, body, uploadConfig({ onProgress }));
  return unwrap(response) ?? null;
}
