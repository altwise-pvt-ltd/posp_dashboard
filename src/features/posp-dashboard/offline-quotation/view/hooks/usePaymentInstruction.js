import { useCallback, useEffect, useState } from 'react';
import { fetchPaymentInstruction } from '../api/paymentInstructionApi';
import { hasPaymentInstruction } from '../lib/quotationStatus';

/**
 * The payment instruction on one quote. Only fetched once the quote's own
 * status is `PROPOSAL_CREATED`; every other state makes no request.
 *
 * `instruction` stays null both before the RM publishes one and when the
 * request fails; the page only offers the drawer when it is set.
 */
export function usePaymentInstruction(quoteId, statusCode) {
  const target = hasPaymentInstruction(statusCode) && quoteId ? quoteId : null;

  const [instruction, setInstruction] = useState(null);
  const [loading, setLoading] = useState(Boolean(target));
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Clear the previous quote's instruction in the same render the id changes.
  const [shown, setShown] = useState(target);
  if (shown !== target) {
    setShown(target);
    setInstruction(null);
    setError(null);
    setLoading(Boolean(target));
  }

  useEffect(() => {
    if (!target) return undefined;

    const controller = new AbortController();
    const { signal } = controller;
    let live = true;

    fetchPaymentInstruction(target, { signal })
      .then((result) => {
        if (!live) return;
        setInstruction(result);
        setError(null);
      })
      .catch((err) => {
        if (!live || signal.aborted) return;
        setInstruction(null);
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

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  return { instruction, loading, error, refresh };
}
