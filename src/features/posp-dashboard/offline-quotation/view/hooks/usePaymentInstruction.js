import { useEffect, useState } from 'react';
import { fetchPaymentInstruction } from '../api/paymentInstructionApi';
import { hasPaymentInstruction } from '../lib/quotationStatus';

/**
 * Fetches the payment instruction once the quote is PROPOSAL_CREATED.
 * Stays null until the RM publishes one, and on any failure.
 */
export function usePaymentInstruction(quoteId, statusCode) {
  const target = hasPaymentInstruction(statusCode) && quoteId ? quoteId : null;

  const [instruction, setInstruction] = useState(null);

  // Clear the previous quote's instruction in the same render the id changes.
  const [shown, setShown] = useState(target);
  if (shown !== target) {
    setShown(target);
    setInstruction(null);
  }

  useEffect(() => {
    if (!target) return undefined;

    const controller = new AbortController();
    const { signal } = controller;
    let live = true;

    fetchPaymentInstruction(target, { signal })
      .then((result) => {
        if (live) setInstruction(result);
      })
      .catch(() => {
        if (live && !signal.aborted) setInstruction(null);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [target]);

  return { instruction };
}
