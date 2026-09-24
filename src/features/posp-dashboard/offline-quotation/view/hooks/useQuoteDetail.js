import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuoteMetadata } from '../../api/quoteMetadataApi';
import { buildQuoteSections } from '../../lib/quoteSections';
import { showAlert } from '@/shared/store/alertStore';
import { fetchQuote, submitQuoteForVerification } from '../api/quoteDetailApi';
import { buildAnswerView } from '../lib/quoteAnswers';

/**
 * One quote, by uuid — the detail screen's whole state.
 *
 * Two requests, in sequence and not in parallel: the quote says which form it
 * was raised on (`productId`, `subProductId`, `fileType`), and only then can
 * the form be fetched to turn `MFG_YEAR: "2020"` into "Manufacturing year:
 * 2020". See `quoteDetailApi`.
 *
 * Only the first of the two can fail the page. If the metadata call falls over,
 * the quote is still shown — header, status, and every answer it holds, under
 * codes made readable instead of the server's own labels. A quote an agent can
 * read imperfectly beats an error screen over a request that was only ever
 * about wording.
 *
 * Deliberately not seeded from the row the user clicked. Passing the list row
 * through router state would paint the header instantly, and would also mean
 * the page renders a status that was true when the *list* was fetched: a quote
 * sent to the insurer five minutes ago would still read "Draft" because that is
 * what the list said. The detail page is the one place a quote's current state
 * is worth being right about, so it asks.
 */
export function useQuoteDetail(quoteId) {
  const [quote, setQuote] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** A metadata failure. Soft — it costs labels, not the page. */
  const [formError, setFormError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Which quote the state above describes.
   *
   * Reset during render rather than in an effect — React's own "adjusting state
   * when a prop changes" pattern. Done in an effect it would take a second
   * commit, and the gap between them paints the *previous* quote's reference
   * and answers under the new URL. Done here, the stale quote never reaches the
   * screen at all.
   */
  const [shown, setShown] = useState(quoteId);

  if (shown !== quoteId) {
    setShown(quoteId);
    setQuote(null);
    setSections([]);
    setError(null);
    setFormError(null);
    setLoading(true);
  }

  useEffect(() => {
    // No id in the URL — nothing to ask for. `missing` covers it below.
    if (!quoteId) return undefined;

    const controller = new AbortController();
    const { signal } = controller;
    let live = true;

    fetchQuote(quoteId, { signal })
      .then(async (result) => {
        if (!live) return;

        setQuote(result);
        setError(null);

        // Nothing to look the answers up against — a quote with no product is
        // rendered from its own fields alone.
        if (!result?.productId) {
          setSections([]);
          return;
        }

        try {
          const metadata = await fetchQuoteMetadata({
            productId: result.productId,
            subProductId: result.subProductId,
            fileType: result.fileType,
            signal,
          });
          if (!live) return;

          // The same builder the create wizard uses, so add-ons and documents
          // arrive labelled rather than as loose codes.
          setSections(buildQuoteSections(metadata));
          setFormError(null);
        } catch (err) {
          if (!live || signal.aborted) return;
          setSections([]);
          setFormError(err);
        }
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

  const answers = useMemo(
    () => buildAnswerView(sections, quote?.values ?? []),
    [sections, quote]
  );

  /**
   * Hand the quote to the back office.
   *
   * Resolves true when it landed, and does not refetch: the caller leaves this
   * screen for the list, which mounts fresh and asks for page 1 of its own
   * accord. Refetching a quote we are about to navigate away from would be a
   * request whose answer nothing renders.
   *
   * The success wording is the server's own — the reply's `message` field —
   * rather than a sentence kept in the app. There is then one place that
   * decides how this reads, and it is the place that decides what happened.
   *
   * Feedback goes through the global alert store rather than local state: the
   * outcome is an event, not a property of the quote, and it has to survive the
   * navigation that follows it. A failure keeps the agent where they are, with
   * the server's reason on screen and the button still there to try again.
   */
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
    setFormError(null);
    setAttempt((n) => n + 1);
  }, []);

  /** A 404 is reported through `missing`; everything else is a real failure. */
  const failure = error?.status === 404 ? null : error;
  const busy = Boolean(quoteId) && loading;

  return {
    quote,
    /** `{ sections, orphans, blanks }` — see `buildAnswerView`. */
    answers,
    /** True when the questions couldn't be fetched, so labels are codes. */
    unlabelled: Boolean(formError) && (quote?.values?.length ?? 0) > 0,
    loading: busy,
    error: failure,
    submitForVerification,
    submitting,
    /** True when there is no such quote to show. */
    missing: !quoteId || error?.status === 404 || (!busy && !failure && !quote),
    retry,
  };
}
