import { create } from 'zustand';
import { logout as logoutRequest } from '@/features/auth/api/authApi';
import { setUnauthorizedHandler } from '@/shared/api/client';
import {
  readStoredSession,
  storeSession,
  clearStoredSession,
} from '@/shared/auth/storedSession';
import { showAlert } from './alertStore';
import { resetOnboarding } from './onboardingStore';
import { resetOnboardingStatus } from './onboardingStatusStore';
import { resetPospProfile } from './pospProfileStore';
import { resetVerification } from './verificationStore';
import { resetCertification } from './certificationStore';
import { resetTrainingPlan } from './trainingPlanStore';

/**
 * Tracks whether the POSP has signed in (mobile + OTP) — the single source of
 * truth the route guard (`RequireFunnel`) and the `/` entry redirect read.
 *
 * Sibling of `onboardingStore`: auth answers "who are you?", onboarding answers
 * "have you finished setup?". A user must pass auth first, then onboarding.
 *
 * Like the other stores, this one seeds itself from storage — see
 * `shared/auth/storedSession.js`. That is what lets the app decide where a
 * visitor belongs on the first render, with no loading state and no request:
 * `/login` is a landing page and a start point, not somewhere the app pauses to
 * ask the server a question.
 *
 * The tradeoff is that "signed in" now means "we are holding a token", which is
 * a claim about this browser rather than about the server's view of it. A token
 * that expired while the tab was closed still reads as signed in until the
 * first request comes back 401 — handled at the bottom of this file, which is
 * the same path a mid-session expiry takes.
 */

/**
 * Read once, at module load, before any component renders. Synchronous on
 * purpose: an async seed would put the app back in the "signed in is unknown"
 * state that the boot-time session probe existed to resolve.
 */
const restored = readStoredSession();

export const useAuthStore = create((set, get) => ({
  /**
   * Kept as its own field because the funnel reads it on every render through
   * `RequireFunnel`.
   */
  authenticated: Boolean(restored),

  /** The signed-in POSP — `{ id, fullName, email, mobile, role }`. Null when not. */
  user: restored?.user ?? null,

  /** Convenience mirror — the topbar and verification screen show the number. */
  mobile: restored?.user?.mobile ?? null,

  /**
   * Which world this session is in: `ONBOARDING`, `CORRECTION` or `REGISTERED`
   * (see `AUTH_FLOW` in `features/auth/api/authApi.js`).
   *
   * Held so a *refresh* can tell the two apart as cheaply as the sign-in did —
   * it rides along in the persisted session, so the answer survives without a
   * request. Nothing routes on it directly: the funnel routes on the flags
   * `resumeSession` sets from it, and adding a second reader of the same fact
   * is how the two would drift.
   */
  flow: restored?.flow ?? null,

  /**
   * The onboarding application this session belongs to: `{ id, currentStep }`,
   * straight off the verify reply.
   *
   * It lives in the auth store rather than the onboarding one because it
   * arrives with the token and dies with it — a new sign-in issues a new
   * application id, and keeping it here means one `clearSession` cannot leave
   * the two out of step.
   */
  application: restored?.application ?? null,

  /** Mirror of `application.id` — what the onboarding requests have to quote. */
  applicationId: restored?.application?.id ?? null,

  /**
   * Called once the OTP is verified, with what `verifyOtp` returned.
   *
   * Persists before it sets state: the two must not disagree, and of the two
   * orders this is the one whose failure mode is survivable. Storage first
   * means a write that throws (see `storedSession.js`) leaves the user signed
   * in for this tab and merely not restored after a refresh — where state first
   * would flip the UI to signed-in and then fail to record it.
   *
   * The whole session object is forwarded to storage rather than a picked
   * subset, so a field added to the verify response survives a refresh without
   * a second edit here.
   */
  signIn: (session = {}) => {
    const { token, user, application, flow } = session;
    storeSession(session);
    set({
      authenticated: Boolean(token),
      user: user ?? null,
      mobile: user?.mobile ?? null,
      flow: flow ?? null,
      application: application ?? null,
      applicationId: application?.id ?? null,
    });
  },

  /**
   * Clears the session — sends the user back to /login.
   *
   * The server call comes first so the token is revoked rather than merely
   * forgotten. A failure there is deliberately swallowed: local state is
   * cleared either way, since a sign-out that appears not to work is worse than
   * one whose server half needs a retry.
   *
   * Deliberately leaves the onboarding flag alone: a real sign-out shouldn't
   * make a fully-onboarded POSP redo the wizard next time they log in.
   */
  signOut: async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignore — clearing local state below is what the user asked for.
    }
    get().clearSession();
  },

  /**
   * Local half of a sign-out, with no server call. Used by the 401 handler,
   * where the token is already dead and posting to /logout would just draw a
   * second 401.
   */
  clearSession: () => {
    clearStoredSession();
    /**
     * The cached onboarding status describes *this* application and was fetched
     * with *this* token, so it dies with them. Left behind, the next sign-in
     * would paint the previous POSP's step positions for as long as it took the
     * fresh status to arrive.
     *
     * Unlike the `onboardingComplete` flag — which survives on purpose, so a
     * finished POSP isn't sent back through the wizard — this is a cache, and
     * a stale cache under a new token has no defensible reading.
     */
    resetOnboardingStatus();
    /** Same reasoning, for the other resume path: the POSP record was fetched
     *  with this token and describes this user. */
    resetPospProfile();
    set({
      authenticated: false,
      user: null,
      mobile: null,
      flow: null,
      application: null,
      applicationId: null,
    });
  },
}));

/**
 * Hook-free helpers so non-React code (route element factories, the login
 * page's verify handler) can read/flip the session without a component:
 *   if (isAuthenticated()) navigate('/overview');
 */
export const isAuthenticated = () => useAuthStore.getState().authenticated;
export const signIn = (session) => useAuthStore.getState().signIn(session);
export const signOut = () => useAuthStore.getState().signOut();

/**
 * The application id, for the onboarding API module to quote on its requests.
 * A plain read rather than a hook, so a request builder can reach it without
 * every caller having to thread it down from a component.
 */
export const getApplicationId = () => useAuthStore.getState().applicationId;

/**
 * What happens when any request comes back 401 — the token expired while the
 * user was sitting on a page, or between the tab being opened and their first
 * action.
 *
 * Registered rather than imported so `client.js` doesn't depend on app state;
 * see the note on `setUnauthorizedHandler`. The route guard subscribes to this
 * store, so clearing it is enough to move the user — no navigate() call from
 * outside the router, and no reload.
 */
setUnauthorizedHandler(() => {
  // Only worth saying if they thought they were signed in. A 401 on a public
  // page is noise the user can do nothing about.
  if (!useAuthStore.getState().authenticated) return;

  useAuthStore.getState().clearSession();
  showAlert({
    variant: 'warning',
    title: 'Session expired',
    message: 'Please sign in again to pick up where you left off.',
  });
});

/**
 * Dev/testing helper — resets the browser back to a brand-new user so you can
 * replay the *whole* funnel (login → onboarding → verification → training →
 * dashboard) from the console:
 *   > Denied()
 * It clears every stage flag on purpose: dropping the session alone would leave
 * `onboardingComplete`, `profileVerification` and `trainingCertified` set, and
 * the next login would skip all three and land straight on the dashboard.
 *
 * Its counterpart is `Approve()` in verificationStore, which stands in for the
 * back office signing off a profile.
 *
 * Because RequireFunnel subscribes to the store, any protected page you're on
 * redirects to /login immediately — no reload needed.
 */
if (typeof window !== 'undefined') {
  window.Denied = async () => {
    await useAuthStore.getState().signOut();
    resetOnboarding();
    resetVerification();
    // Two different facts, two different stores: the exam pass, then the
    // enrolment. Clearing one without the other leaves a half-replayed funnel.
    resetCertification();
    // The chosen insurance line goes too — otherwise the replay skips the
    // choice screen and studies whatever the last run picked.
    resetTrainingPlan();
    console.log(
      '[auth] Denied() — session + onboarding + verification + training cleared. Next login goes through the full flow: login → onboarding → verification → training → dashboard.'
    );
  };
}
