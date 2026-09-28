import { useCallback, useEffect, useState } from 'react';
import { fetchQuoteResponses } from '../api/quoteCompareApi';
import { hasInsurerResponses } from '../lib/quotationStatus';

/**
 * The insurers' answers to one quote, when there are any to have.
 *
 * A third request on the detail screen, and the only one that is conditional:
 * it runs when — and only when — the quote's own reply came back in a state
 * that has responses (`hasInsurerResponses`). The gate is the status and not
 * the result of asking, because `compare` answers an empty list rather than a
 * 404 on a quote nobody has responded to, so asking a draft succeeds and
 * returns nothing, and the screen would then have to decide whether an empty
 * list means "no answers yet" or "never sent". The status already knows.
 *
 * Kept out of `useQuoteDetail` for the same reason it is conditional: that hook
 * is a fixed pair of requests that either produce the page or fail it, and this
 * one can fail entirely without costing the page anything. A quote whose
 * responses cannot be fetched is still a quote worth reading.
 *
 * Takes `statusCode` rather than the whole quote so nothing re-runs on the new
 * object identity a refetch produces when the quote itself has not changed.
 */
export function useQuoteResponses(quoteId, statusCode) {
  const expected = hasInsurerResponses(statusCode);

  /**
   * What to ask for, or null for "don't ask".
   *
   * The two conditions are folded into one value because they change at
   * different times and mean the same thing to everything below: `statusCode`
   * arrives a request later than `quoteId` does, so a quote that turns out to
   * have responses flips this from null to an id without the URL moving.
   */
  const target = expected && quoteId ? quoteId : null;

  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(Boolean(target));
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  /**
   * Which target the state above describes.
   *
   * Reset during render rather than in an effect — the same pattern, and for
   * the same reason, as `shown` in `useQuoteDetail`: done in an effect it takes
   * a second commit, and the gap paints the previous quote's responses under
   * the new one. It also keeps the effect free of synchronous `setState`, which
   * is what cascades renders.
   */
  const [shown, setShown] = useState(target);

  if (shown !== target) {
    setShown(target);
    setResponses([]);
    setError(null);
    // True the moment there is something to ask for, so the panel opens in its
    // loading state rather than flashing "nothing yet" for one frame.
    setLoading(Boolean(target));
  }

  useEffect(() => {
    // Either the quote is still loading or it is in a state with nothing to
    // compare. The reset above has already cleared what was here.
    if (!target) return undefined;

    const controller = new AbortController();
    const { signal } = controller;
    let live = true;

    fetchQuoteResponses(target, { signal })
      .then((result) => {
        if (!live) return;
        setResponses(result.responses);
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

  return {
    responses,
    /** True while the responses are being fetched — never for a quote without. */
    loading,
    error,
    /** Whether to render the panel at all. Decided by the status, not the list. */
    expected,
    retry,
  };
}
