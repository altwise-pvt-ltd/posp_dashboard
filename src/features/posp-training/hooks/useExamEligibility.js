import { useCallback, useEffect, useState } from 'react';
import { fetchExamEligibility } from '../api/examApi';

/**
 * Where this POSP stands with the examiner — asked on the way in, not on the way
 * out.
 *
 * `GET /exam/eligibility` was already the last thing between the caution dialog
 * and an attempt (see `handleStartExam`), but until now it was *only* that: the
 * page knew nothing about the examiner's verdict until somebody pressed a
 * button. That left two states rendering wrongly for as long as the page sat
 * open:
 *
 *   passed elsewhere — a POSP who sat and cleared the paper on another device
 *                      came back to a syllabus and a "Start exam" button, and
 *                      had to press it to be told they were already certified.
 *   shut out         — a POSP the server will refuse got the same open-looking
 *                      panel, and found out only after accepting a caution about
 *                      spending an attempt.
 *
 * Both are answerable on mount for the price of one cheap GET, which is what
 * this does.
 *
 * ⚠ This does not replace the check on the press. It is a *fresher* reading that
 * a failed sitting on another device can invalidate while this page sits open,
 * and it is the reading taken before an attempt is spent. This hook makes the
 * page honest; that call keeps it safe.
 *
 * Failure is deliberately not fatal. `error` is returned for a caller that wants
 * it, but nothing here blocks the page: "we could not ask" leaves the programme
 * rendering exactly as it did before this hook existed, and the press-time call
 * is still there to refuse the attempt properly. Blocking the whole page on an
 * optimisation would be trading a working screen for a spinner.
 *
 * The `isLive` guard is the arrangement `useCertificate` and `useCourseMaterial`
 * use: the effect passes a guard that goes false on unmount, `refresh` passes
 * nothing and always applies its answer.
 */
export function useExamEligibility() {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    (isLive = () => true) =>
      fetchExamEligibility()
        .then((result) => {
          if (!isLive()) return;
          setEligibility(result);
          setError(null);
        })
        .catch((err) => {
          /* Cleared rather than kept: a stale verdict under a failed refresh is
             worse than no verdict, because the page acts on this one. */
          if (!isLive()) return;
          setEligibility(null);
          setError(err);
        })
        .finally(() => {
          if (isLive()) setLoading(false);
        }),
    []
  );

  useEffect(() => {
    let live = true;
    load(() => live);

    return () => {
      live = false;
    };
  }, [load]);

  /* Wrapped rather than passed straight through: an onClick hands its event to
     the first argument, and `load` would call that event as the liveness
     guard. */
  const refresh = useCallback(() => load(), [load]);

  return { eligibility, loading, error, refresh };
}
