/**
 * The onboarding wizard's steps, in order, once.
 *
 * This file is the seam between two numbering schemes that are not going to be
 * reconciled: the server counts steps from 1 (`stepNumber` on
 * `GET /onboarding/status`) and the wizard indexes its own array from 0.
 * Everything crossing that line goes through `toStepIndex` / `toStepNumber`
 * here, so the off-by-one lives in one place instead of at every call site.
 *
 * `key` is what the wizard files a step's form data under, and what each step's
 * own endpoint will be named after once those are wired. Steps are matched to
 * the server by *position*, never by `name` — the server's titles are display
 * copy and are free to be reworded without breaking the mapping.
 */
export const STEPS = [
  { key: 'pan',       label: 'Step 1', title: 'PAN Details'     },
  { key: 'email',     label: 'Step 2', title: 'Email Verify'    },
  { key: 'aadhaar',   label: 'Step 3', title: 'Aadhaar'         },
  { key: 'selfie',    label: 'Step 4', title: 'Selfie'          },
  { key: 'bank',      label: 'Step 5', title: 'Bank Account'    },
  { key: 'education', label: 'Step 6', title: 'Education'       },
  { key: 'business',  label: 'Step 7', title: 'Business'        },
  { key: 'review',    label: 'Step 8', title: 'Review & Submit' },
];

export const STEP_COUNT = STEPS.length;

/** Last step — the only one that isn't a form, and the parking spot for a
 *  submitted application that navigates back into the wizard. */
export const REVIEW_INDEX = STEP_COUNT - 1;

/**
 * Keep an index inside the array. Applied to anything derived from the server:
 * a step count that grows on the backend before it grows here would otherwise
 * render `undefined` rather than simply stopping at Review.
 */
export const clampIndex = (index) =>
  Math.min(Math.max(Number.isInteger(index) ? index : 0, 0), REVIEW_INDEX);

/**
 * Server step number → wizard index. Returns null for anything that isn't a
 * number, so callers can fall through to the next signal rather than silently
 * treating a missing field as step 1.
 */
export const toStepIndex = (stepNumber) =>
  Number.isFinite(stepNumber) ? clampIndex(Math.trunc(stepNumber) - 1) : null;

/** Wizard index → server step number, for the requests that quote it. */
export const toStepNumber = (index) => clampIndex(index) + 1;

/** The data key for a step, by index. */
export const stepKeyAt = (index) => STEPS[clampIndex(index)].key;
