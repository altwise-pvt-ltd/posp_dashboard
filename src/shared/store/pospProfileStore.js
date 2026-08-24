import { create } from 'zustand';
import { fetchPospProfile } from '@/features/profile/api/pospApi';
import {
  VERIFICATION,
  useVerificationStore,
  approveVerification,
  rejectVerification,
  submitForReview,
} from './verificationStore';

/**
 * The registered POSP's record — the server's answer, held for the app.
 *
 * Mirror image of `onboardingStatusStore`, and deliberately shaped the same
 * (`refresh` / `ensureLoaded` / `reset`, never rejecting) so the two resume
 * paths differ in *which* call they make, not in how a caller handles it.
 *
 * Which one runs is decided by `flow` on the verify-otp reply:
 *
 *   ONBOARDING → onboardingStatusStore   "where in the form are they?"
 *   CORRECTION → onboardingStatusStore   same question, reopened by a reviewer
 *   REGISTERED → this store              "what has the back office decided?"
 *
 * Not persisted, unlike the onboarding status cache. That one exists to keep
 * the wizard from flashing step 1 before the real step arrives; there is no
 * equivalent flicker here, because the flag the funnel actually routes on lives
 * in `verificationStore` and is already persisted in localStorage. Caching the
 * profile as well would add a second copy of the same verdict that could go
 * stale independently.
 */

/**
 * The in-flight request, so the sign-in call and a page's mount effect can't
 * fire two of them. Module-scoped rather than store state — it's plumbing, and
 * nothing renders off it.
 */
let inFlight = null;

/**
 * Move the funnel's verification flag onto the server's verdict.
 *
 * The server is the authority here in both directions — unlike the onboarding
 * flag, which is synced *up* only because "Skip for now" is a legitimate local
 * override. There is no local way to be verified, so a downgrade is as real as
 * an approval and is applied.
 *
 * A verdict that matches what is already stored is a no-op rather than a
 * rewrite: `submitForReview()` clears the rejection reasons, and a POSP sitting
 * on the rejection screen while a refresh confirms they are still rejected
 * should not watch the reasons disappear.
 *
 * ⚠ A rejection reaching here carries no reasons. `overallStatus` — the field
 * `resumeSession` derives from — says *that* the profile was sent back, not
 * *what* was wrong, and `/posp/me` is no better. The waiting screen renders the
 * rejection banner with an unflagged checklist until the API exposes the
 * per-document reasons, at which point they map straight onto the
 * `[{ id, reason }]` shape `rejectVerification` already takes.
 *
 * It lives in this file rather than next to `resumeSession` because it is the
 * one place the two stores are allowed to touch, and keeping that seam in the
 * store makes it findable from either side.
 */
export function applyVerificationVerdict(verdict) {
  if (!verdict || verdict === useVerificationStore.getState().status) return;

  if (verdict === VERIFICATION.VERIFIED) approveVerification();
  else if (verdict === VERIFICATION.REJECTED) rejectVerification([]);
  else submitForReview();
}

export const usePospProfileStore = create((set, get) => ({
  /** Normalised `GET /posp/me`, or null before the first load. */
  profile: null,

  /** True once a call has actually answered. Not persisted — see above. */
  validated: false,

  loading: false,
  error: null,

  /**
   * Fetch the profile and adopt it. Resolves to the profile, or null if the
   * call failed — it never rejects, because every caller's fallback is the same
   * (carry on; the screen surfaces the error).
   */
  refresh: () => {
    if (inFlight) return inFlight;

    set({ loading: true, error: null });

    inFlight = fetchPospProfile()
      .then((profile) => {
        /**
         * The profile is adopted and nothing else. It used to push its own
         * `verification` into the funnel flag, which made this call a second
         * writer of a fact `resumeSession` had already set from `overallStatus`
         * — two sources for one verdict, racing on every sign-in, and the
         * coarser one arriving second. The verdict now has exactly one writer;
         * `profile.verification` is left as a read-only second opinion.
         */
        set({ profile, validated: true, loading: false, error: null });
        return profile;
      })
      .catch((error) => {
        // `validated` stays false: a failed attempt is not an answer.
        set({ loading: false, error });
        return null;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  },

  /** Fetch unless this page load already has — what a screen calls on mount,
   *  so the sign-in path's fetch isn't paid for twice. */
  ensureLoaded: () => {
    const { validated, refresh, profile } = get();
    if (validated) return Promise.resolve(profile);
    return refresh();
  },

  /** Sign-out / new session. The record described *that* token's POSP. */
  reset: () => {
    inFlight = null;
    set({ profile: null, validated: false, loading: false, error: null });
  },
}));

/**
 * Hook-free helpers, so the sign-in path and `authStore` can reach this without
 * being components.
 */
export const refreshPospProfile = () => usePospProfileStore.getState().refresh();
export const ensurePospProfile = () => usePospProfileStore.getState().ensureLoaded();
export const resetPospProfile = () => usePospProfileStore.getState().reset();
