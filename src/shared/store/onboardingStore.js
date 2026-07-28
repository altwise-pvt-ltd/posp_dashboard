import { create } from 'zustand';

/**
 * Tracks whether the POSP has finished the onboarding wizard. The flag is
 * persisted in localStorage so a completed user stays "onboarded" across
 * reloads — this is the single source of truth the route guard
 * (`RequireOnboarding`) and the `/` entry redirect read.
 */
const STORAGE_KEY = 'onboardingComplete';

// Read the persisted flag. Wrapped in try/catch because localStorage can throw
// in private-mode / SSR-ish contexts; default to "not onboarded" if so.
const readFlag = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeFlag = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // Ignore — the in-memory store state still updates below.
  }
};

export const useOnboardingStore = create((set) => ({
  // Seed from localStorage so a returning user is already onboarded on mount.
  complete: readFlag(),

  // Called at the end of the wizard's submit handler.
  completeOnboarding: () => {
    writeFlag(true);
    set({ complete: true });
  },

  // Mostly for dev/testing — sends the user back through the wizard.
  resetOnboarding: () => {
    writeFlag(false);
    set({ complete: false });
  },
}));

/**
 * Hook-free helpers so non-React code (route element factories, the wizard's
 * submit handler) can read/flip the flag without a component:
 *   if (isOnboardingComplete()) navigate('/overview');
 */
export const isOnboardingComplete = () => useOnboardingStore.getState().complete;
export const completeOnboarding = () => useOnboardingStore.getState().completeOnboarding();
export const resetOnboarding = () => useOnboardingStore.getState().resetOnboarding();
