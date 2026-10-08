import { useCallback, useEffect, useState } from 'react';
import { fetchQuoteDocuments } from '../api/quoteDocumentListApi';

/**
 * The documents stored on one quote. The last good list stays on screen while
 * a refresh is in flight.
 */
export function useQuoteDocuments(quoteId) {
  const [attempt, setAttempt] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [settled, setSettled] = useState({ key: null, error: null });

  const key = quoteId ? `${quoteId}|${attempt}` : null;

  useEffect(() => {
    if (!key) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    fetchQuoteDocuments(quoteId, { signal })
      .then((result) => {
        if (signal.aborted) return;
        setDocuments(result);
        setSettled({ key, error: null });
      })
      .catch((error) => {
        if (signal.aborted) return;
        setSettled({ key, error });
      });

    return () => controller.abort();
  }, [key, quoteId]);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);
  const current = settled.key === key;

  return {
    documents,
    loading: key !== null && !current,
    error: current ? settled.error : null,
    refresh,
  };
}
