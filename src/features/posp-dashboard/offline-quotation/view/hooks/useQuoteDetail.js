import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuoteMetadata } from '@/features/posp-dashboard/offline-quotation/api/quoteMetadataApi';
import { buildQuoteSections } from '@/features/posp-dashboard/offline-quotation/lib/quoteSections';
import { showAlert } from '@/shared/store/alertStore';
import { fetchQuote, submitQuoteForVerification } from '../api/quoteDetailApi';
import { buildAnswerView } from '../lib/quoteAnswers';

const NO_FORM = { scope: null, metadata: null, sections: [], error: null };

/**
 * Loads one quote, and separately the form metadata used to label its answers.
 * The page shows as soon as the quote arrives. Metadata is fetched again only when
 * the product changes, or after it failed. A metadata failure leaves codes as labels.
 */
export function useQuoteDetail(quoteId) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState(NO_FORM);
  const [formAttempt, setFormAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Reset state during render when the id changes, so the old quote is never shown.
  const [shown, setShown] = useState(quoteId);

  if (shown !== quoteId) {
    setShown(quoteId);
    setQuote(null);
    setError(null);
    setLoading(true);
  }

  useEffect(() => {
    // No id: nothing to fetch; `missing` covers it.
    if (!quoteId) return undefined;

    const controller = new AbortController();
    const { signal } = controller;
    let live = true;

    fetchQuote(quoteId, { signal })
      .then((result) => {
        if (!live) return;
        setQuote(result);
        setError(null);
      })
      .catch((err) => {
        if (!live || signal.aborted) return;
        setQuote(null);
        setError(err);
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [quoteId, attempt]);

  const productId = quote?.productId ?? null;
  const subProductId = quote?.subProductId ?? null;
  const fileType = quote?.fileType ?? null;

  // The product the labels belong to; null when there is no product to fetch for.
  const scope = productId ? JSON.stringify([productId, subProductId, fileType]) : null;

  useEffect(() => {
    if (!scope) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    fetchQuoteMetadata({ productId, subProductId, fileType, signal })
      .then((metadata) => {
        if (signal.aborted) return;
        // Same builder as the create wizard.
        setForm({ scope, metadata, sections: buildQuoteSections(metadata), error: null });
      })
      .catch((err) => {
        if (signal.aborted) return;
        setForm({ ...NO_FORM, scope, error: err });
      });

    return () => controller.abort();
  }, [scope, formAttempt, productId, subProductId, fileType]);

  // A retry for the same product keeps the last result on screen until the new one lands.
  const current = scope !== null && form.scope === scope ? form : NO_FORM;
  const labelsLoading = scope !== null && form.scope !== scope;
  const formFailed = Boolean(current.error);

  // Answers wait for their labels instead of showing raw codes first.
  const answers = useMemo(
    () => buildAnswerView(current.sections, labelsLoading ? [] : quote?.values ?? []),
    [current.sections, labelsLoading, quote]
  );

  // Submits the quote for verification and shows the outcome as a global alert.
  // Resolves true on success; no refetch, since the caller navigates away.
  const submitForVerification = useCallback(async () => {
    if (!quoteId || submitting) return false;

    setSubmitting(true);

    try {
      const { message } = await submitQuoteForVerification(quoteId);

      showAlert({
        variant: 'success',
        title: 'Sent for verification',
        message: message || 'This quotation is now with the team for checking.',
      });

      return true;
    } catch (err) {
      showAlert({
        variant: 'error',
        title: "Couldn't send for verification",
        message: err?.message || 'The request did not go through. Please try again.',
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [quoteId, submitting]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
    if (formFailed) setFormAttempt((n) => n + 1);
  }, [formFailed]);

  // Refetches without setting loading, so the current quote stays until the reply lands.
  // Metadata is fetched again only if it failed last time.
  const refresh = useCallback(() => {
    setAttempt((n) => n + 1);
    if (formFailed) setFormAttempt((n) => n + 1);
  }, [formFailed]);

  // A 404 is reported through `missing`; anything else is a real failure.
  const failure = error?.status === 404 ? null : error;
  const busy = Boolean(quoteId) && loading;

  return {
    quote,
    // Null if the metadata couldn't be fetched.
    metadata: current.metadata,
    // `{ sections, orphans }` from buildAnswerView.
    answers,
    // Metadata failed, so answers are labelled by code.
    unlabelled: formFailed && (quote?.values?.length ?? 0) > 0,
    loading: busy,
    error: failure,
    submitForVerification,
    submitting,
    missing: !quoteId || error?.status === 404 || (!busy && !failure && !quote),
    retry,
    refresh,
  };
}
