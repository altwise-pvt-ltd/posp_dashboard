import { useCallback, useEffect, useState } from 'react';
import { hydrateTrainingPlan } from '@/shared/store/trainingPlanStore';
import { loadTrainingRecord } from '../api/trainingRecord';

/**
 * Fetch the training record and hold it in the plan store. No React state of its
 * own — the hook below wraps it, and keeping the two apart is what lets the
 * mount path and the retry path share this without either duplicating it.
 *
 * On this path null *is* a real answer — the LMS holds no training record, i.e.
 * they have genuinely not enrolled — and `hydrate` clears the local plan to
 * match. A lookup that could not be *made* rejects instead, before the store is
 * touched: hydrating null there would wipe a plan the POSP may have built this
 * very session and send them back to the choice screen over a failed request
 * that had nothing to do with it.
 */
async function loadTrainingProgress() {
  hydrateTrainingPlan(await loadTrainingRecord());
}

/**
 * Ask the LMS where this POSP actually stands, before the page decides what to
 * render.
 *
 * The bug this exists for: the chosen line lived only in localStorage, so a POSP
 * who signed in on a second device — or cleared their data — was shown "What
 * will you be selling?" for a programme they were already hours into. The server
 * knew all along; nothing ever asked it.
 *
 * Deliberately runs on every mount of the training page rather than once per
 * session: the hours move while the POSP is elsewhere, and this is the one
 * screen that has to be right about them.
 *
 * Named for the *record*, not for "progress". `fetchTrainingProgress` and
 * `updateTrainingProgress` in `trainingApi` are the server's hours-and-deltas
 * vocabulary; this hook reads the whole record once so the page can decide which
 * screen to show. Calling it `useTrainingProgress` put it in the same family as
 * two functions it has nothing to do with.
 */
export function useTrainingRecord() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;

    /* `live` guards the local state only. The store write inside is not guarded:
       the store outlives this hook, and an answer arriving after the page closed
       is still the right thing to have cached for the next mount. */
    loadTrainingProgress()
      .catch((err) => live && setError(err))
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
  }, []);

  /* A retry, unlike a mount, has to put the loading state back up itself — the
     initial state already said loading, this one is coming back from an error. */
  const retry = useCallback(
    () => {
      setLoading(true);
      setError(null);

      return loadTrainingProgress()
        .catch(setError)
        .finally(() => setLoading(false));
    },
    []
  );

  return { loading, error, retry };
}
