import { create } from 'zustand';
import { resetOnboarding } from './onboardingStore';
import { resetVerification } from './verificationStore';
import { resetTraining } from './trainingStore';

/**
 * Tracks whether the POSP has signed in (mobile + OTP). The session is
 * persisted in localStorage so a signed-in user stays authenticated across
 * reloads — this is the single source of truth the route guard
 * (`RequireFunnel`) and the `/` entry redirect read.
 *
 * Sibling of `onboardingStore`: auth answers "who are you?", onboarding answers
 * "have you finished setup?". A user must pass auth first, then onboarding.
 */
const STORAGE_KEY = 'authSession';

// Read the persisted session. Wrapped in try/catch because localStorage can
// throw in private-mode / SSR-ish contexts; default to "signed out" if so.
const readSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSession = (session) => {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore — the in-memory store state still updates below.
  }
};

const initial = readSession();

export const useAuthStore = create((set) => ({
  // Seed from localStorage so a returning user is already signed in on mount.
  authenticated: Boolean(initial),
  mobile: initial?.mobile ?? null,

  // Called once the OTP is verified at the end of the login flow.
  signIn: (mobile) => {
    writeSession({ mobile });
    set({ authenticated: true, mobile });
  },

  // Clears the session — sends the user back to /login. Deliberately leaves the
  // onboarding flag alone: a real sign-out shouldn't make a fully-onboarded POSP
  // redo the wizard next time they log in.
  signOut: () => {
    writeSession(null);
    set({ authenticated: false, mobile: null });
  },
}));

/**
 * Hook-free helpers so non-React code (route element factories, the login
 * page's verify handler) can read/flip the session without a component:
 *   if (isAuthenticated()) navigate('/overview');
 */
export const isAuthenticated = () => useAuthStore.getState().authenticated;
export const signIn = (mobile) => useAuthStore.getState().signIn(mobile);
export const signOut = () => useAuthStore.getState().signOut();

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
  window.Denied = () => {
    useAuthStore.getState().signOut();
    resetOnboarding();
    resetVerification();
    resetTraining();
    console.log(
      '[auth] Denied() — session + onboarding + verification + training cleared. Next login goes through the full flow: login → onboarding → verification → training → dashboard.'
    );
  };
}
