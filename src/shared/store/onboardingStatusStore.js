import { create } from 'zustand';
import { fetchOnboardingStatus } from '@/features/onboarding/api/onboardingApi';
import { clampIndex } from '@/features/onboarding/model/steps';
import { completeOnboarding } from './onboardingStore';

/**
 * Where the POSP got to in the wizard — the server's answer, held for the app.
 *
 * Sibling of `onboardingStore`, and the division is deliberate: that one is a
 * boolean the route guard reads ("is the wizard behind them?"), this one is the
 * detail behind it ("which step, and which are done?"). Keeping them apart
 * means the guard stays a synchronous flag read and doesn't grow a loading
 * state.
 *
 * ── Two kinds of position ─────────────────────────────────────────────────
 *
 * `status.stepIndex` is the server's word on where to resume. `stepIndex` is
 * where the user is standing right now. They start equal and diverge as soon as
 * someone clicks Next.
 *
 * Only `load()` moves the second one back onto the first, and `load()` runs
 * once per page load. So navigation inside a sitting is never yanked around by
 * a background refresh, and a *reload* returns the user to what the server has
 * actually recorded. That second half is the point: until a step's own endpoint
 * exists, "I filled in three steps and refreshed" genuinely means nothing was
 * saved, and putting them back at step 1 is the honest answer rather than a
 * regression.
 */

/**
 * Persisted so a refresh repaints the right step immediately instead of
 * flashing a spinner — the same trick `shared/auth/storedSession.js` plays with
 * the session, and for the same reason. `sessionStorage` to match: this is
 * per-application state and has no business outliving the token that fetched
 * it.
 *
 * It's a cache, not the truth. `validated` below is what stops it being trusted
 * indefinitely.
 */
const STATUS_KEY = 'posp.onboarding.status';

function readStoredStatus() {
  try {
    const raw = window.sessionStorage.getItem(STATUS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Blocked, partitioned, or corrupt. Degrades to "fetch it" — see load().
    return null;
  }
}

function writeStoredStatus(status) {
  try {
    window.sessionStorage.setItem(STATUS_KEY, JSON.stringify(status));
  } catch {
    // Nothing useful to do: the wizard works for this page load, it just costs
    // a spinner on the next refresh.
  }
}

function clearStoredStatus() {
  try {
    window.sessionStorage.removeItem(STATUS_KEY);
  } catch {
    // Ignore: see writeStoredStatus().
  }
}

const restored = readStoredStatus();

/**
 * The in-flight request, so the sign-in call and the wizard's mount effect
 * can't fire two of them. Module-scoped rather than store state because it's
 * plumbing — nothing renders off it.
 */
let inFlight = null;

export const useOnboardingStatusStore = create((set, get) => ({
  /** Normalised `GET /onboarding/status`, or null before the first load. */
  status: restored,

  /** The step being shown right now. See the note on the two positions above. */
  stepIndex: restored?.stepIndex ?? 0,

  /**
   * False on every fresh page load, even when `status` was restored from
   * storage — restoring is what makes the first paint instant, this is what
   * makes sure the paint gets checked. Not persisted, deliberately.
   */
  validated: false,

  loading: false,
  error: null,

  /**
   * Steps finished in this browser since the last `load()`, by key.
   *
   * Held apart from `status.completedKeys` rather than merged into it: that
   * field is the server's record and stays that way, so a refetch can't be
   * confused by something we optimistically wrote into it. The two are unioned
   * at the point of display.
   */
  localCompleted: [],

  /**
   * Fetch the status and adopt it. Resolves to the status, or null if the call
   * failed — it never rejects, because every caller's fallback is the same
   * (carry on, the screen surfaces the error).
   */
  refresh: () => {
    if (inFlight) return inFlight;

    set({ loading: true, error: null });

    inFlight = fetchOnboardingStatus()
      .then((status) => {
        writeStoredStatus(status);
        set({
          status,
          stepIndex: status.stepIndex,
          localCompleted: [],
          validated: true,
          loading: false,
          error: null,
        });

        /**
         * Sync the funnel flag *up* only. A server that says the application is
         * in means the wizard is behind them wherever they signed in from,
         * which is the whole cross-device case. The reverse isn't symmetrical:
         * "Skip for now" sets the local flag on purpose while the server still
         * reports incomplete, and clearing it here would trap a skipper in a
         * wizard they chose to leave.
         */
        if (status.isCompleted) completeOnboarding();

        return status;
      })
      .catch((error) => {
        // `validated` stays false: this was a failed attempt, not an answer,
        // and the screen offers a retry.
        set({ loading: false, error });
        return null;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  },

  /**
   * Fetch unless this page load already has. What the wizard calls on mount —
   * the sign-in path has usually just done it, and this is what keeps that from
   * costing a second round trip.
   */
  ensureLoaded: () => {
    const { validated, refresh, status } = get();
    if (validated) return Promise.resolve(status);
    return refresh();
  },

  /** Move within the wizard. Clamped, so a stray +1 past Review is a no-op. */
  goToStep: (index) => set({ stepIndex: clampIndex(index) }),

  /**
   * Mark a step done locally, on the user's word rather than the server's.
   *
   * Correct for now because the steps only hold their data in React state; once
   * each has an endpoint, its success handler should call `refresh()` and this
   * becomes the optimistic half of that — which is why it's kept separate from
   * the server's list rather than written into it.
   */
  markStepComplete: (key) =>
    set((state) =>
      state.localCompleted.includes(key)
        ? state
        : { localCompleted: [...state.localCompleted, key] }
    ),

  /** Sign-out / new application. Drops the cache too — a stale step index under
   *  a fresh token is worse than no index at all. */
  reset: () => {
    clearStoredStatus();
    inFlight = null;
    set({
      status: null,
      stepIndex: 0,
      validated: false,
      loading: false,
      error: null,
      localCompleted: [],
    });
  },
}));

/**
 * Hook-free helpers, so the login page's verify handler and `authStore` can
 * reach this without being components.
 */
export const refreshOnboardingStatus = () =>
  useOnboardingStatusStore.getState().refresh();

export const resetOnboardingStatus = () =>
  useOnboardingStatusStore.getState().reset();
