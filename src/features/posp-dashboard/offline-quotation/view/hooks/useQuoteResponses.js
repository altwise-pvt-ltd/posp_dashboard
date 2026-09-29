import { useCallback, useEffect, useState } from 'react';
import { showAlert } from '@/shared/store/alertStore';
import { fetchQuoteResponses, selectQuoteResponse } from '../api/quoteCompareApi';
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
   * Which response is being chosen right now, or null.
   *
   * An id and not a boolean: the panel renders every response at once, and the
   * card whose button was pressed is the one that should show the spinner
   * while the others simply go quiet. A flag could say that *something* is in
   * flight but not which, and the agent would be looking at three identical
   * disabled buttons wondering which one they pressed.
   */
  const [selectingId, setSelectingId] = useState(null);

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
    setSelectingId(null);
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

  /**
   * Choose one of the responses to go ahead with.
   *
   * On success the list is refetched rather than patched. The server owns
   * `isSelected`, and it is the only thing that knows what else the choice
   * changed — whether the other responses are still selectable, whether the
   * quote's own status moved. Flipping the card locally would show a badge this
   * app decided to draw, and the first reload would be the moment anyone found
   * out whether it was true. The refetch costs one request on an action taken
   * once per quote.
   *
   * Feedback goes through the global alert store, the same as
   * `submitForVerification`: the outcome is an event, not a property of the
   * response. A failure changes nothing on screen — the buttons come back and
   * the server's reason is on the alert.
   *
   * Resolves true when it landed, for a caller that wants to close something.
   */
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

        // Not in a `finally`: the refetch below is what clears the card's busy
        // state, so that the button does not come back for the half-second
        // between the POST landing and the new list arriving.
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
    /** True while the responses are being fetched — never for a quote without. */
    loading,
    error,
    /** Whether to render the panel at all. Decided by the status, not the list. */
    expected,
    retry,
    /** `select(responseId)` → posts the choice, then refetches. */
    select,
    /** The `responseId` currently being posted, or null. */
    selectingId,
  };
}
