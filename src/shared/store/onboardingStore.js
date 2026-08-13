import { createFlagStore } from './createFlagStore';

/**
 * Tracks whether the POSP has finished the onboarding wizard. The flag is
 * persisted in localStorage so a completed user stays "onboarded" across
 * reloads — this is the single source of truth the route guard
 * (`RequireFunnel`) and the `/` entry redirect read.
 *
 * Second gate in the funnel: auth asks "who are you?", this one "have you
 * filled it in?", then verification and training. See `app/funnel.js` for the
 * order they run in.
 */
export const useOnboardingStore = createFlagStore('onboardingComplete');

/**
 * Hook-free helpers so non-React code (the funnel's stage list, the wizard's
 * submit handler) can read/flip the flag without a component:
 *   if (isOnboardingComplete()) navigate('/verification');
 */
export const isOnboardingComplete = () => useOnboardingStore.getState().value;

/** Called at the end of the wizard's submit handler. */
export const completeOnboarding = () => useOnboardingStore.getState().setValue(true);

/** Mostly for dev/testing — sends the user back through the wizard. */
export const resetOnboarding = () => useOnboardingStore.getState().setValue(false);
