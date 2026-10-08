import { useEffect, useState } from 'react';
import { fetchQuoteDocumentBlob } from '../api/quoteDocumentListApi';

/**
 * One quote document's bytes and its own object URL for them. Nothing is
 * fetched while `documentId` is null. The URL is revoked when the document
 * changes or the component unmounts.
 *
 * The result is stored against the request it answers, so a result for a
 * previous document is never shown for the current one.
 */
export function useDocumentBlob(quoteId, documentId) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, blob: null, url: null, error: null });

  const key = quoteId && documentId ? `${quoteId}|${documentId}|${attempt}` : null;

  useEffect(() => {
    if (!key) return undefined;

    let url = null;
    let live = true;

    fetchQuoteDocumentBlob(quoteId, documentId)
      .then((blob) => {
        if (!live) return;
        url = URL.createObjectURL(blob);
        setResult({ key, blob, url, error: null });
      })
      .catch((error) => {
        if (live) setResult({ key, blob: null, url: null, error });
      });

    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [key, quoteId, documentId]);

  const current = key !== null && result.key === key;

  return {
    blob: current ? result.blob : null,
    url: current ? result.url : null,
    error: current ? result.error : null,
    loading: key !== null && !current,
    retry: () => setAttempt((n) => n + 1),
  };
}
