import { useCallback, useEffect, useState } from 'react';
import { fetchCourseMaterial } from '../api/courseApi';

/**
 * The study material for one insurance type.
 *
 * Local state rather than a store, for the same reasons as `useInsuranceTypes`:
 * it is read on one screen, never written to, and the LMS can publish a chapter
 * at any time — caching it across the session would only add a way for the page
 * to be out of date.
 *
 * A null id is the ordinary case, not an error: `TrainingProgramme` mounts this
 * before the POSP has chosen a line, and there is nothing to ask for until they
 * have. It reports "not loading, no material" and fetches the moment an id
 * arrives.
 *
 * Deliberately not a gate. The countdown, the progress rail and the exam all run
 * without this — a failure here costs the learner their reading material for as
 * long as it takes to press Try again, and must never cost them the hours they
 * are serving.
 */
export function useCourseMaterial(insuranceTypeId) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * The fetch and the state it settles — deliberately *not* including the
   * `loading` flag going up. That is already this hook's initial state, and
   * raising it from inside an effect is a second render before the request has
   * even left. The retry path, which is an event and starts from a settled
   * error, raises it itself.
   *
   * `isLive` is how the mount path and the retry path share one body: the effect
   * passes a guard that goes false on unmount, the retry button passes nothing
   * and always applies its own answer.
   */
  const load = useCallback(
    (isLive = () => true) =>
      fetchCourseMaterial(insuranceTypeId)
        .then((data) => {
          if (!isLive()) return;
          setCourses(data);
          setError(null);
        })
        .catch((err) => {
          if (!isLive()) return;
          // Cleared rather than kept: a stale syllabus under an error message
          // reads as "this is your material, and something also went wrong".
          setCourses([]);
          setError(err);
        })
        .finally(() => {
          if (isLive()) setLoading(false);
        }),
    [insuranceTypeId]
  );

  useEffect(() => {
    if (!insuranceTypeId) return undefined;

    let live = true;
    load(() => live);

    return () => {
      live = false;
    };
  }, [insuranceTypeId, load]);

  /* Wrapped, not passed straight through: an onClick hands its event to the
     first argument, and `load` would call that event as the liveness guard. */
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    return load();
  }, [load]);

  /**
   * Nothing chosen, so nothing to have loaded — answered here rather than by
   * resetting state from the effect. Clearing through the effect would be a
   * second render every time, and until it landed the screen would still be
   * holding the previous line's chapters.
   */
  if (!insuranceTypeId) {
    return { courses: [], loading: false, error: null, retry };
  }

  return { courses, loading, error, retry };
}
