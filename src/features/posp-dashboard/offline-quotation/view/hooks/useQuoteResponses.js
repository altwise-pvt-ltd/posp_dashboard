import { useCallback, useEffect, useState } from 'react';
import { showAlert } from '@/shared/store/alertStore';
import { fetchQuoteResponses, selectQuoteResponse } from '../api/quoteCompareApi';
import { hasInsurerResponses } from '../lib/quotationStatus';

/**
 * Fetches the insurer responses for a quote, only when its status says there are some
 * (/compare returns an empty list, not a 404, for quotes with none).
 */
export function useQuoteResponses(quoteId, statusCode, hasSelection = false) {
  // A quote with a selected offer had responses, so they are fetched in every later state too.
  // ⚠ Unconfirmed that /compare still answers after acceptance; the page hides the result quietly if not.
  const expected = hasInsurerResponses(statusCode) || hasSelection;

  // The quote to fetch for, or null to skip.
  const target = expected && quoteId ? quoteId : null;

  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(Boolean(target));
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // The response id currently being selected, or null.
  const [selectingId, setSelectingId] = useState(null);

  // Reset state during render when the target changes, so old responses are never shown.
  const [shown, setShown] = useState(target);

  if (shown !== target) {
    setShown(target);
    setResponses([]);
    setError(null);
    setSelectingId(null);
    setLoading(Boolean(target));
  }

  useEffect(() => {
    if (!target) return undefined;

    const controller = new AbortController();
    const { signal } = controller;
    let live = true;

    fetchQuoteResponses(target, { signal })
      .then((result) => {
        if (!live) return;
        setResponses(result);
        setError(null);
      })
      .catch((err) => {
        if (!live || signal.aborted) return;
        setResponses([]);
        setError(err);
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [target, attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  // Posts the chosen response, alerts the outcome, and refetches the list on success.
  // Resolves true on success.
  const select = useCallback(
    async (responseId) => {
      if (!target || !responseId || selectingId) return false;

      setSelectingId(responseId);

      try {
        const { message } = await selectQuoteResponse(target, responseId);

        showAlert({
          variant: 'success',
          title: 'Policy selected',
          message: message || 'This insurer response is now the selected one on this quotation.',
        });

        // Clear selecting and raise loading together, then refetch.
        setSelectingId(null);
        setLoading(true);
        setAttempt((n) => n + 1);

        return true;
      } catch (err) {
        showAlert({
          variant: 'error',
          title: "Couldn't select this policy",
          message: err?.message || 'The request did not go through. Please try again.',
        });

        setSelectingId(null);
        return false;
      }
    },
    [target, selectingId]
  );

  return {
    responses,
    loading,
    error,
    // Whether responses exist for this quote, decided by status.
    expected,
    retry,
    select,
    selectingId,
  };
}
