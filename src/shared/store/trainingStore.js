import { createFlagStore } from './createFlagStore';

/**
 * Tracks whether the POSP has passed the certification exam. The flag is
 * persisted in localStorage so a certified user stays certified across reloads
 * — this is the single source of truth the route guard (`RequireFunnel`) and
 * the `/` entry redirect read.
 *
 * Last gate in the funnel, after auth, onboarding and back-office verification:
 * this one answers "are you licensed to sell yet?". The dashboard sits behind
 * all four. See `app/funnel.js` for the order they run in.
 */
export const useTrainingStore = createFlagStore('trainingCertified');

/**
 * Hook-free helpers so non-React code (the funnel's stage list, the exam
 * portal's certificate handler) can read/flip the flag without a component:
 *   if (isTrainingComplete()) navigate('/overview');
 */
export const isTrainingComplete = () => useTrainingStore.getState().value;

/**
 * Called the moment the learner reaches the certificate — i.e. on a pass. A
 * failed attempt never gets here, so the dashboard stays locked.
 */
export const completeTraining = () => useTrainingStore.getState().setValue(true);

/** Mostly for dev/testing — sends the user back through the programme. */
export const resetTraining = () => useTrainingStore.getState().setValue(false);
