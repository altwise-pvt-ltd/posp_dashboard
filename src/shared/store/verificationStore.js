import { create } from 'zustand';

/**
 * Tracks what the back office has decided about the POSP's submitted profile.
 * Persisted in localStorage so the verdict survives a reload — this is the
 * single source of truth the route guard (`RequireFunnel`) and the `/`
 * entry redirect read.
 *
 * Third gate in the funnel: auth asks "who are you?", onboarding "have you
 * filled it in?", this one "has a human checked it?", and training "are you
 * licensed?". Training and everything past it sit behind this.
 *
 * Three values in the store, because a rejection has to say *what* was wrong
 * and an approval has to be *seen* before the funnel moves on:
 *   status       — pending | verified | rejected
 *   rejections   — [{ id, reason }], the documents sent back and why
 *   acknowledged — has the POSP read the approval and pressed on?
 *
 * `acknowledged` is what keeps a cleared profile on the verification screen
 * instead of being swept past it. The verdict — good or bad — is the one thing
 * this whole stage exists to deliver, and `landingPath()` walking straight to
 * training the moment the flag flipped meant a POSP could be approved and never
 * see it said. So the funnel treats this stage as clear only once both are
 * true: the team said yes, *and* the user pressed Start POSP training. The
 * route guard on `/posp-training` still asks only about `status`, so the button
 * itself is never blocked by the flag it is about to set.
 *
 * They are kept in separate localStorage keys rather than one JSON blob so the
 * status stays a plain readable string — the thing you check first when the
 * funnel sends someone somewhere unexpected.
 */
const STATUS_KEY = 'profileVerification';
const REJECTIONS_KEY = 'profileRejections';
const ACK_KEY = 'profileVerificationSeen';

export const VERIFICATION = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

/**
 * A representative rejection for the demo control and `Reject()`. Two entries
 * rather than one so the screen is exercised with a list, which is the shape
 * the real response will have — a reviewer rarely sends back exactly one thing.
 * The ids match `UNDER_REVIEW` on the verification page.
 */
const DEMO_REJECTIONS = [
  {
    id: 'pan',
    reason: 'The name on your PAN does not match the name you entered.',
  },
  {
    id: 'photo',
    reason: 'Your photograph is too blurred to check against your Aadhaar record.',
  },
];

// Read the persisted status. Wrapped in try/catch because localStorage can
// throw in private-mode / SSR-ish contexts. Anything unrecognised falls back to
// "pending" — the safe direction, since it only ever holds someone back rather
// than letting an unchecked profile through.
const readStatus = () => {
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    return Object.values(VERIFICATION).includes(raw) ? raw : VERIFICATION.PENDING;
  } catch {
    return VERIFICATION.PENDING;
  }
};

const readRejections = () => {
  try {
    const raw = localStorage.getItem(REJECTIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Unparseable is treated as "nothing sent back" rather than throwing on
    // mount — a lost reason is recoverable, a page that won't render isn't.
    return [];
  }
};

const readAcknowledged = () => {
  try {
    return localStorage.getItem(ACK_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Every verdict write also clears the acknowledgement, including the approval
 * itself: a fresh decision is by definition one the POSP hasn't seen yet, so it
 * has to hold them on the screen that shows it. Only `acknowledgeVerification`
 * sets the flag, and only from the button.
 */
const write = (status, rejections) => {
  try {
    localStorage.setItem(STATUS_KEY, status);
    localStorage.setItem(REJECTIONS_KEY, JSON.stringify(rejections));
    localStorage.removeItem(ACK_KEY);
  } catch {
    // Ignore — the in-memory store state still updates below.
  }
};

export const useVerificationStore = create((set) => ({
  // Seed from localStorage so a decided profile isn't sent back to wait.
  status: readStatus(),
  rejections: readRejections(),
  acknowledged: readAcknowledged(),

  /**
   * The team's approval. Stands in for the webhook / polled status call that
   * will replace it — nothing in the UI should care which one flipped the flag,
   * which is why the waiting screen subscribes to this store rather than
   * owning the state itself.
   *
   * Deliberately does *not* acknowledge: approving is the back office's act,
   * acknowledging is the POSP's. A POSP sitting on the waiting screen when this
   * lands watches it turn green and then chooses to go on.
   */
  approveVerification: () => {
    write(VERIFICATION.VERIFIED, []);
    set({ status: VERIFICATION.VERIFIED, rejections: [], acknowledged: false });
  },

  /**
   * The POSP has read the approval and pressed Start POSP training. Only from
   * that button: this is the record that the verdict was actually delivered,
   * and it's what lets `landingPath()` send them to training on every visit
   * from here on instead of back through this screen.
   */
  acknowledgeVerification: () => {
    try {
      localStorage.setItem(ACK_KEY, 'true');
    } catch {
      // Ignore — in-memory still updates, so this session moves on regardless;
      // only the "don't show me again" outlives the tab.
    }
    set({ acknowledged: true });
  },

  /**
   * The team sending the profile back. `rejections` is [{ id, reason }] naming
   * the documents at fault; the ids match the checklist on the waiting screen,
   * so each one can be shown against the thing it refers to instead of as a
   * wall of error text.
   */
  rejectVerification: (rejections = DEMO_REJECTIONS) => {
    write(VERIFICATION.REJECTED, rejections);
    set({ status: VERIFICATION.REJECTED, rejections, acknowledged: false });
  },

  /**
   * Back into the queue — a first submission, or a rejected POSP resubmitting
   * after fixing what was flagged. Clears the old rejections: they describe the
   * previous submission and would otherwise be shown against the new one.
   */
  submitForReview: () => {
    write(VERIFICATION.PENDING, []);
    set({ status: VERIFICATION.PENDING, rejections: [], acknowledged: false });
  },
}));

/**
 * Hook-free helpers so non-React code (route element factories, the entry
 * redirect, the onboarding submit handler) can read/flip the status without a
 * component:
 *   if (isVerified()) navigate('/posp-training');
 */
export const isVerified = () =>
  useVerificationStore.getState().status === VERIFICATION.VERIFIED;

/**
 * What the *funnel* means by "this stage is behind you" — approved and read.
 * `isVerified` alone answers "may they be in training?", which is what the
 * route guard asks; this answers "is there still something on the verification
 * screen for them?", which is what `landingPath()` asks. They differ for
 * exactly one moment — an approval the POSP hasn't opened yet — and that moment
 * is the whole point of the screen.
 */
export const isVerificationSeen = () => {
  const { status, acknowledged } = useVerificationStore.getState();
  return status === VERIFICATION.VERIFIED && acknowledged;
};

export const approveVerification = () =>
  useVerificationStore.getState().approveVerification();
export const acknowledgeVerification = () =>
  useVerificationStore.getState().acknowledgeVerification();
export const rejectVerification = (rejections) =>
  useVerificationStore.getState().rejectVerification(rejections);
export const submitForReview = () =>
  useVerificationStore.getState().submitForReview();
/** Alias kept for the `Denied()` full-funnel reset in authStore. */
export const resetVerification = submitForReview;

/**
 * Dev/demo helpers — the back office deciding, from the console:
 *   > Approve()   // signed off; training opens
 *   > Reject()    // sent back with the demo reasons; pass your own array to vary them
 *   > Pending()   // back in the review queue
 *
 * The waiting screen subscribes to the store, so it flips between its three
 * states immediately; no reload needed.
 *
 * `Pending()` exists because a verdict is persisted and therefore sticky: once
 * a profile is approved *and* acknowledged the entry redirect skips this screen,
 * and without this the only way back to it would be `Denied()` in authStore,
 * which also drops the session and the onboarding flag — a full replay of the
 * funnel to look at one screen. This rewinds that single stage.
 */
if (typeof window !== 'undefined') {
  window.Approve = () => {
    approveVerification();
    console.log('[verification] Approve() — profile marked verified. Training is now open.');
  };

  window.Reject = (rejections) => {
    rejectVerification(rejections);
    console.log(
      '[verification] Reject() — profile sent back:',
      useVerificationStore.getState().rejections
    );
  };

  window.Pending = () => {
    submitForReview();
    console.log(
      '[verification] Pending() — profile back in the review queue. Visit /verification to see the waiting screen.'
    );
  };
}
