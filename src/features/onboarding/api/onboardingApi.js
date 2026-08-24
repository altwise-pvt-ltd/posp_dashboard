import { api, unwrap, uploadConfig } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { STEPS, REVIEW_INDEX, clampIndex, toStepIndex } from '../model/steps';

/**
 * The onboarding application's state, as the wizard sees it.
 *
 * This is the resume mechanism. A POSP who signs up, fills in two steps and
 * closes the tab has left their progress on the server, not in this browser —
 * so "where were they?" is a question only the server can answer, and this is
 * the call that asks it.
 *
 * Everything the server sends is normalised here rather than in the store or
 * the screen, so the wire format is confined to one file: the wizard never sees
 * `mobileNumber`, `stepNumber` or a 1-based count.
 */

/**
 * Fold the server's step list into the wizard's own.
 *
 * The wizard's list is the one that renders, always at full length — a server
 * that sends six steps, or none at all, must not produce a wizard with holes in
 * it. Server rows are matched in by `stepNumber` and contribute completion
 * state and copy; anything unmatched keeps the local defaults and reads as
 * pending, which is the safe direction to be wrong in (it asks the user to
 * confirm a step, rather than skipping one they never filled).
 */
function mergeSteps(rawSteps) {
  const byNumber = new Map();
  if (Array.isArray(rawSteps)) {
    for (const step of rawSteps) {
      if (Number.isFinite(step?.stepNumber)) byNumber.set(step.stepNumber, step);
    }
  }

  return STEPS.map((step, index) => {
    const raw = byNumber.get(index + 1);
    return {
      ...step,
      index,
      number: index + 1,
      // Server copy wins so a reworded title reaches the UI without a deploy
      // here; the local string is the fallback, not the default.
      title: raw?.name ?? step.title,
      description: raw?.description ?? null,
      isCompleted: raw?.isCompleted === true,
      isCurrent: raw?.isCurrent === true,
    };
  });
}

/**
 * Which step to drop the user on.
 *
 * Three signals say roughly the same thing and can disagree, so they're ranked
 * rather than merged:
 *
 *   1. `steps[].isCurrent` — the server pointing at a step by hand. Most
 *      explicit, so it wins outright.
 *   2. `nextStep`, then `currentStep` — these agree while a step is open and
 *      diverge the moment one is finished, which is exactly when "next" is the
 *      one that means "carry on here".
 *   3. First step still incomplete — a derivation, used only if the server sent
 *      no numbers at all.
 */
function resolveStepIndex(data, steps) {
  const current = steps.findIndex((step) => step.isCurrent);
  if (current !== -1) return current;

  const fromNumber = toStepIndex(data.nextStep) ?? toStepIndex(data.currentStep);
  if (fromNumber !== null) return fromNumber;

  const firstOpen = steps.findIndex((step) => !step.isCompleted);
  return firstOpen === -1 ? REVIEW_INDEX : firstOpen;
}

/**
 * Wire shape → app shape. Exported for tests; `fetchOnboardingStatus` is what
 * the app calls.
 *
 * Every field is defaulted, because a resume that throws on a missing key is
 * worse than one that starts the user at step 1: the first loses the session,
 * the second costs them a few taps.
 */
export function normalizeStatus(data = {}) {
  const steps = mergeSteps(data.steps);
  const isCompleted = data.isCompleted === true;

  return {
    applicationId: data.applicationId ?? null,
    mobile: data.mobileNumber ?? null,

    /** Lifecycle of the application itself — e.g. `InProgress`. */
    status: data.status ?? null,
    /** The headline reason it's sitting where it is — e.g. `PAN_PENDING`. */
    overallStatus: data.overallStatus ?? null,

    isCompleted,
    /** Absent means allowed: a server that stops sending this shouldn't
     *  silently freeze every form in the wizard. */
    isEditingAllowed: data.isEditingAllowed !== false,
    /** Absent means *not* allowed — the opposite default, because the cost of
     *  being wrong is a submission the server will reject. */
    isSubmissionAllowed: data.isSubmissionAllowed === true,
    /** Human-readable list of what's still missing. Drives the Review screen
     *  once submit is wired; already worth carrying so it's a read, not a
     *  re-integration. */
    blockingReasons: Array.isArray(data.blockingReasons) ? data.blockingReasons : [],

    pospId: data.pospId ?? null,
    kycStatus: data.kycStatus ?? null,

    steps,
    completedKeys: steps.filter((step) => step.isCompleted).map((step) => step.key),

    /**
     * A submitted application has nothing left to resume, so it parks on
     * Review — the one step that still has something to say. The funnel would
     * normally route them to /verification anyway; this only matters when they
     * follow the breadcrumb back in to re-read what they sent.
     */
    stepIndex: isCompleted ? REVIEW_INDEX : clampIndex(resolveStepIndex(data, steps)),
  };
}

/** Ask the server where this application stands. Requires the bearer token. */
export async function fetchOnboardingStatus() {
  const response = await api.get(ENDPOINTS.onboarding.status);
  return normalizeStatus(unwrap(response) ?? {});
}

/* ── Step 1 · PAN ──────────────────────────────────────────────────────── */

/**
 * dd/mm/yyyy (what the form collects) → yyyy/MM/dd (what the API takes).
 *
 * The two formats hold the same three numbers and differ only in order, which
 * is exactly the kind of mismatch that survives a smoke test and comes back
 * weeks later as "06/05/2004 was saved as the 5th of June". The step keeps
 * collecting the format Indian users type; the translation lives here, at the
 * wire boundary, with the rest of the field-name mapping.
 *
 * A value that isn't a well-formed dd/mm/yyyy is passed through untouched —
 * `panSchema` has already rejected those, so anything else arriving here is a
 * shape this function has no business guessing at.
 */
function toApiDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

/**
 * Save step 1.
 *
 * Multipart, not JSON, because of the image — `uploadConfig()` supplies the
 * longer ceiling and, just as importantly, leaves Content-Type unset so the
 * browser writes the multipart boundary itself.
 *
 * The field names are the server's, taken from a request it accepted rather
 * than from the form: `fullname` is lowercase where the form says `fullName`,
 * and this is the seam where that stops being the UI's problem. (The backend is
 * ASP.NET and binds case-insensitively, so `fullName` would very likely bind
 * too — matching the proven request exactly is the cheaper bet either way.)
 *
 * DOB is optional in the form and omitted here when blank. If the server turns
 * out to require it, the fix is in `panSchema`, not here — a required field
 * should be enforced where the user can still see the input.
 */
export async function submitPanDetails({
  panNumber,
  fullName,
  dateOfBirth,
  panFrontImage,
} = {}) {
  const body = new FormData();
  body.append('panNumber', panNumber);
  body.append('fullname', fullName);
  if (dateOfBirth) body.append('dateOfBirth', toApiDate(dateOfBirth));
  if (panFrontImage) body.append('panFrontImage', panFrontImage, panFrontImage.name);

  const response = await api.post(
    ENDPOINTS.onboarding.submitPanDetails,
    body,
    uploadConfig()
  );
  return unwrap(response) ?? null;
}

/* ── Step 2 · Email ────────────────────────────────────────────────────── */

/**
 * Dispatch a verification code to `email`.
 *
 * Doubles as the resend: unlike the sign-in flow — which has a dedicated
 * `resendOtp` because the server throttles the two differently — there is one
 * email route, so asking twice is asking the same way twice. If a separate
 * resend endpoint appears, it goes here as its own function rather than a flag
 * on this one, so the caller keeps naming which of the two it meant.
 *
 * The reply is `{ message, expiresInSeconds }`. Note that `expiresInSeconds` is
 * the code's own lifetime, *not* a resend throttle — reading it as one would
 * lock the resend button for the entire window the user is meant to be typing
 * in. The throttle, when there is one, arrives as `Retry-After` on a 429 and is
 * normalised onto `ApiError.retryAfter`.
 */
export async function sendEmailOtp(email) {
  const response = await api.post(ENDPOINTS.onboarding.sendEmailVerification, { email });
  return unwrap(response) ?? null;
}

/**
 * Confirm the code. Both fields travel in the body — see the note on
 * `ENDPOINTS.onboarding.verifyEmail`.
 *
 * The reply is `{ isVerified, email, nextStep, verifiedAt }` and is returned
 * whole rather than picked over. Unlike the sign-in verify — which trades an
 * OTP for a token and has to fail loudly when none comes back — nothing here is
 * load-bearing: a reply that reached this line is a success by definition (the
 * client interceptor rejects `success: false`), and the durable record of
 * "email confirmed" is what `GET /onboarding/status` reports.
 */
export async function verifyEmailOtp(email, otp) {
  const response = await api.post(ENDPOINTS.onboarding.verifyEmail, { email, otp });
  return unwrap(response) ?? null;
}

/* ── Step 3 · Aadhaar ──────────────────────────────────────────────────── */

/**
 * Save step 3.
 *
 * Multipart for the same reason PAN is — two images this time, which is also
 * why `uploadConfig()`'s longer ceiling earns its keep here more than anywhere
 * else in the wizard.
 *
 * Two translations happen at this boundary, both of them the wire's business
 * rather than the form's:
 *
 *   - `aadhaar` → `aadhaarNumber`. The form names the field after what it asks
 *     for; the server names it after what it stores.
 *   - The spaces come out. The input formats as `XXXX XXXX XXXX` because that
 *     is how the number is printed and read back, and the server wants the bare
 *     twelve digits. Stripping here rather than trusting the caller means a
 *     value that arrives still formatted cannot reach the server that way.
 *
 * `fullName` is camelCase, which is the contract's own spelling — the lowercase
 * `fullname` in `submitPanDetails` is a copy of a request that was known to
 * work, not a second convention. (Swagger gives `fullName` for both; PAN's
 * spelling binds only because ASP.NET is case-insensitive.)
 *
 * The server also accepts `dateOfBirth`, `gender` and `address` here, all
 * optional and none of them collected by the step. If they're ever wanted, they
 * belong in `aadhaarSchema` first — a field the user can't see is a field they
 * can't fix when the server rejects it.
 */
export async function submitAadhaarDetails({
  aadhaar,
  fullName,
  aadhaarFrontImage,
  aadhaarBackImage,
} = {}) {
  const body = new FormData();
  body.append('aadhaarNumber', String(aadhaar ?? '').replace(/\s/g, ''));
  body.append('fullName', fullName);
  if (aadhaarFrontImage) body.append('aadhaarFrontImage', aadhaarFrontImage, aadhaarFrontImage.name);
  // Optional to the server, required by the step's schema — so this is a guard
  // against a caller that skipped validation, not an expected absence.
  if (aadhaarBackImage) body.append('aadhaarBackImage', aadhaarBackImage, aadhaarBackImage.name);

  const response = await api.post(
    ENDPOINTS.onboarding.submitAadhaarDetails,
    body,
    uploadConfig()
  );
  return unwrap(response) ?? null;
}

/* ── Step 4 · Selfie ───────────────────────────────────────────────────── */

/**
 * Save step 4 — the profile picture.
 *
 * One part, `selfieImage`, and nothing else on the request. The file arriving
 * here has already been through `prepareFile` in the step, which is what
 * guarantees it is really an image and, on iOS, that a HEIC has been transcoded
 * to JPEG rather than uploaded as bytes the rest of the stack can't read.
 *
 * `onProgress` is plumbed through because this is the one step whose upload is
 * a single large file with nothing else on screen to look at.
 */
export async function uploadSelfie(selfieImage, { onProgress } = {}) {
  const body = new FormData();
  body.append('selfieImage', selfieImage, selfieImage.name);

  const response = await api.post(
    ENDPOINTS.onboarding.uploadProfilePicture,
    body,
    uploadConfig({ onProgress })
  );
  return unwrap(response) ?? null;
}

/* ── Step 5 · Bank ─────────────────────────────────────────────────────── */

/* ── Masters ───────────────────────────────────────────────────────────── */

/**
 * The server's dropdown lists, as `[{ value, label }]`.
 *
 * These are requests rather than constants for one reason: `value` and `label`
 * are not the same string. The server stores `SAVINGS` and displays `Savings`;
 * it stores `POST_GRADUATE` and displays `Post Graduate`. A step that submitted
 * what it rendered would send the label, and one that hardcoded its own guess
 * at the stored form would send something like `PostGraduate` — which is what
 * this step did before, and what the server has no row for.
 *
 * There is no local fallback list, deliberately — see the note in
 * `useMasterOptions`. A malformed payload yields an empty array, which the
 * steps treat the same as a failed request: say so and offer a retry, rather
 * than proceed on a list this file invented.
 *
 * Entries missing a `value` are dropped rather than passed through: the value
 * is the only part that gets submitted, so an option without one is a button
 * that cannot be answered with.
 */
async function fetchMasterOptions(endpoint) {
  const response = await api.get(endpoint);
  const raw = unwrap(response);
  if (!Array.isArray(raw)) return [];

  return raw
    .map((option) => ({
      value: option?.value ?? '',
      label: option?.label ?? option?.value ?? '',
    }))
    .filter((option) => option.value);
}

/** Account types for the bank step. */
export const fetchAccountTypes = () =>
  fetchMasterOptions(ENDPOINTS.onboarding.getBankTypes);

/** Qualifications for the education step. */
export const fetchQualifications = () =>
  fetchMasterOptions(ENDPOINTS.onboarding.getQualificationTypes);

/** Business types for the business step. */
export const fetchBusinessTypes = () =>
  fetchMasterOptions(ENDPOINTS.onboarding.getBusinessTypes);

/* ── Geography ─────────────────────────────────────────────────────────── */

/**
 * All 36 states and union territories, as `[{ value, label }]`.
 *
 * Module-level and argument-free so it is referentially stable — `useMasterOptions`
 * takes the fetcher as an effect dependency, and an inline arrow would re-run
 * the request on every render.
 */
export const fetchStates = () => fetchMasterOptions(ENDPOINTS.geography.states);

/**
 * The districts of one state, as `[{ value, label }]`.
 *
 * Takes the state's exact name from `fetchStates` — the server matches on it
 * literally and answers a misspelling with an empty list rather than an error,
 * so "no districts" and "no such state" arrive looking identical. The step
 * avoids ever asking the question: the state field commits only a value picked
 * or matched against the fetched list, so anything reaching here is a name the
 * server supplied.
 *
 * An empty or absent state short-circuits without a request. The district field
 * is disabled until a state is chosen, so this is the belt to that braces —
 * without it, a cleared state would fire a `?state=` call whose empty result is
 * then indistinguishable from a real one.
 */
export async function fetchDistricts(state) {
  if (!state) return [];
  const response = await api.get(ENDPOINTS.geography.districts, { params: { state } });
  const raw = unwrap(response);
  if (!Array.isArray(raw)) return [];

  return raw
    .map((option) => ({
      value: option?.value ?? '',
      label: option?.label ?? option?.value ?? '',
    }))
    .filter((option) => option.value);
}

/**
 * One PIN code → the state, district and localities it covers.
 *
 * The only geography call that isn't a list, and the reason the PIN is the fast
 * path through the address: six digits settle two fields that would otherwise
 * be two searches.
 *
 * Returns `null` for a PIN the server doesn't recognise rather than throwing,
 * because an unknown PIN is a normal thing for a user to type on the way to a
 * real one — the step treats it as "fill the rest in yourself", not as an error
 * worth a toast. A genuine failure (network, 500) still throws, so the two stay
 * distinguishable; only the shape of the *answer* is softened here.
 */
export async function fetchPincodeDetails(pincode) {
  const response = await api.get(ENDPOINTS.geography.pincode(pincode));
  const data = unwrap(response);
  if (!data || typeof data !== 'object') return null;

  return {
    pincode: data.pincode ?? String(pincode),
    state: data.state ?? '',
    district: data.district ?? '',
    /** Localities inside the PIN. Suggestions for address line 2 — the form
     *  neither requires one nor stores the list. */
    areas: Array.isArray(data.areas) ? data.areas.filter(Boolean) : [],
  };
}

/**
 * Match a value already held by a form to one of a masters list's `value`s.
 *
 * Comparison ignores case *and* punctuation, which is what makes it worth
 * having: `PostGraduate` and `POST_GRADUATE` differ by an underscore as well as
 * a case, so a `toLowerCase()` match would quietly fail on exactly the option
 * most likely to have been hardcoded wrong. Returns the server's spelling, so
 * whatever a form was holding, what it submits is the server's own value.
 */
const loosely = (value) =>
  String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function matchMasterValue(saved, options) {
  const target = loosely(saved);
  if (!target) return null;
  return options.find((option) => loosely(option.value) === target)?.value ?? null;
}

/**
 * Save step 5.
 *
 * Three field names change at this boundary — `accountHolder` →
 * `accountHolderName`, `ifsc` → `ifscCode`, `chequeImage` →
 * `cancelledChequeImage` — and `confirmAccountNumber` never leaves the browser,
 * since re-typing the number is a check on the user, not a fact about them.
 *
 * `branchName` is accepted by the server and optional; no input collects it
 * yet, so it is omitted in practice. Kept in the signature so adding that field
 * to the step is a change to the step alone.
 *
 * `accountType` must be a `value` from `fetchAccountTypes` — `SAVINGS`, not
 * `Savings` and not `savings`.
 */
export async function saveBankDetails({
  accountNumber,
  accountHolder,
  ifsc,
  bankName,
  branchName,
  accountType,
  passbookImage,
  chequeImage,
} = {}) {
  const body = new FormData();
  body.append('accountNumber', accountNumber);
  body.append('accountHolderName', accountHolder);
  body.append('ifscCode', ifsc);
  body.append('bankName', bankName);
  if (branchName) body.append('branchName', branchName);
  if (accountType) body.append('accountType', accountType);
  if (passbookImage) body.append('passbookImage', passbookImage, passbookImage.name);
  if (chequeImage) body.append('cancelledChequeImage', chequeImage, chequeImage.name);

  const response = await api.post(
    ENDPOINTS.onboarding.saveBankDetails,
    body,
    uploadConfig()
  );
  return unwrap(response) ?? null;
}

/* ── Step 6 · Education ────────────────────────────────────────────────── */

/**
 * Save step 6.
 *
 * The one step whose field names need no translation — the form and the wire
 * already agree on all five. What does need care is what's *absent*:
 * `highestQualification` is the only required part, and the other four are
 * omitted entirely when empty rather than sent blank, so an optional the user
 * skipped reads as "not provided" instead of "provided as an empty string".
 *
 * `highestQualification` must be a `value` from `fetchQualifications` —
 * `POST_GRADUATE`, not `PostGraduate`.
 *
 * `passingYear` is an int32 on the wire. It is stringified because that is what
 * FormData holds; the server parses it back. The step has already narrowed it
 * to four digits in a sane range, so there is nothing to validate here.
 */
export async function saveEducationDetails({
  highestQualification,
  institutionName,
  boardOrUniversity,
  passingYear,
  certificateImage,
} = {}) {
  const body = new FormData();
  body.append('highestQualification', highestQualification);
  if (institutionName) body.append('institutionName', institutionName);
  if (boardOrUniversity) body.append('boardOrUniversity', boardOrUniversity);
  if (passingYear) body.append('passingYear', String(passingYear));
  if (certificateImage) body.append('certificateImage', certificateImage, certificateImage.name);

  const response = await api.post(
    ENDPOINTS.onboarding.saveEducationDetails,
    body,
    uploadConfig()
  );
  return unwrap(response) ?? null;
}

/* ── Step 7 · Business ─────────────────────────────────────────────────── */

/**
 * Save step 7.
 *
 * JSON, not multipart — the odd one out among the save endpoints, and for a
 * plain reason: it is the only step with no document to attach. There is
 * nothing here for `uploadConfig()` to do, so the default timeout applies.
 *
 * Empty optionals are sent as `null` rather than omitted. That is the opposite
 * of what the multipart steps do, and it follows the same principle: a JSON
 * body has a way to say "this field is empty" that a form-data body does not,
 * and `null` on a nullable field is how the server hears "clear it" instead of
 * "leave it alone". Omitting them would make a save that clears an address line
 * indistinguishable from one that never mentioned it.
 *
 * `hasGst` is a real field on the wire, not just the UI's gate for revealing
 * the GSTIN input. It is coerced to a boolean and paired with the number: on
 * `false` the GSTIN is nulled regardless of what was typed before the user
 * changed their mind, so the two can never disagree in the record.
 *
 * `hasBusiness` works the same way, one level up. The step asks it before
 * anything else and only collects a type and a name when the answer is yes, so
 * on `false` both are nulled here as well as in the step — the record can never
 * say "no business" and still carry a business name. The address is sent on
 * either branch; it is the one thing this step always wants, whether it
 * describes a registered business or just where the POSP lives.
 *
 * NOTE: this assumes the server treats `businessType` and `businessName` as
 * nullable. If it rejects a `hasBusiness: false` save for a missing type or
 * name, the field is required server-side and the fix belongs there — sending
 * a filler value would put a business on the record that does not exist.
 *
 * `businessType` must be a `value` from `fetchBusinessTypes` —
 * `PRIVATE_LIMITED`, not `Private Limited`.
 */
export async function saveBusinessDetails({
  hasBusiness,
  businessType,
  businessName,
  addressLine1,
  addressLine2,
  city,
  state,
  pincode,
  hasGst,
  gstIn,
} = {}) {
  const owns = Boolean(hasBusiness);
  const response = await api.post(ENDPOINTS.onboarding.saveBusinessDetails, {
    hasBusiness: owns,
    businessType: owns ? businessType || null : null,
    businessName: owns ? businessName || null : null,
    addressLine1,
    addressLine2: addressLine2 || null,
    city,
    state,
    pincode,
    hasGst: owns && Boolean(hasGst),
    gstIn: owns && hasGst ? gstIn || null : null,
  });
  return unwrap(response) ?? null;
}

/* ── Step 8 · Review ───────────────────────────────────────────────────── */

/**
 * ISO timestamp → `dd/mm/yyyy`, the format the forms show and collect.
 *
 * The calendar parts are read straight off the string rather than through
 * `new Date()`, because that round trip is not timezone-safe in the way it
 * looks: per spec a date-only `2001-10-29` parses as UTC while a date-time
 * `2001-10-29T00:00:00` parses as *local*, so whether the displayed day shifts
 * by one depends on which of the two forms the server happened to send and on
 * which side of UTC the user is. The server currently sends the date-time form,
 * which is the safe one — this avoids depending on that staying true.
 *
 * Returns null for anything that isn't a leading ISO date, so a malformed value
 * reads as "not provided" rather than as `Invalid Date` on screen.
 */
function toDisplayDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (!match) return null;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * The whole application, wire shape → the shape the Review screen reads.
 *
 * Every section is renamed into the *form's* field names rather than left as
 * the server sent them. That is the point of this function: the review screen
 * and the inline editors are the same components the wizard uses, so a section
 * normalised to form names can be handed to `rows()` for display and to a
 * step's `initialValues` for editing without a second translation in between.
 * It is `normalizeBank`'s job, generalised to all seven.
 *
 * Documents stay as keys. A key is not a file and nothing here pretends
 * otherwise — fetching the bytes is `fetchDocumentBlob`'s job, and only for the
 * ones actually rendered.
 *
 * A section the server has nothing for comes back as `{}` rather than null, so
 * callers can spread it without guarding every access.
 */
export function normalizeReview(data = {}) {
  const pan = data.pan ?? {};
  const aadhaar = data.aadhaar ?? {};
  const selfie = data.selfie ?? {};
  const bank = data.bank ?? {};
  const education = data.education ?? {};
  const business = data.business ?? {};

  return {
    applicationId: data.applicationId ?? null,
    mobile: data.mobileNumber ?? null,
    overallStatus: data.overallStatus ?? null,
    /** Absent means *not* allowed — the same default `normalizeStatus` uses,
     *  and for the same reason: the cost of being wrong is a rejected submit. */
    isSubmissionAllowed: data.isSubmissionAllowed === true,
    isEditingAllowed: data.isEditingAllowed !== false,
    blockingReasons: Array.isArray(data.blockingReasons) ? data.blockingReasons : [],

    /**
     * Each section's own `isCompleted`, kept out of the sections themselves.
     *
     * A section object is handed to a step as `initialValues`, so anything put
     * in it becomes a form field. `isCompleted` is a fact about the record, not
     * a value the user typed, and it has no business riding into a form — hence
     * a sibling map keyed the same way.
     */
    completion: {
      pan: pan.isCompleted === true,
      // The server tracks no `isCompleted` for the address — it is either
      // verified and present or it is not.
      email: Boolean(data.email),
      aadhaar: aadhaar.isCompleted === true,
      selfie: selfie.isCompleted === true,
      bank: bank.isCompleted === true,
      education: education.isCompleted === true,
      business: business.isCompleted === true,
    },

    sections: {
      pan: {
        panNumber: pan.panNumber ?? '',
        fullName: pan.fullName ?? '',
        dateOfBirth: toDisplayDate(pan.dateOfBirth) ?? '',
        panFrontImageKey: pan.frontDocumentKey ?? null,
        /** The save endpoint accepts a PAN back image and the view returns one;
         *  no step collects it yet, so this is display-only for now. */
        panBackImageKey: pan.backDocumentKey ?? null,
      },

      /** The address lives at the top level of the response, not in a section
       *  of its own — there is no `EmailView`, only a verified string. */
      email: { email: data.email ?? '' },

      aadhaar: {
        aadhaar: aadhaar.aadhaarNumber ?? '',
        fullName: aadhaar.fullName ?? '',
        /**
         * Carried, though `AadhaarStep` collects none of the three and so never
         * sends them — they arrive null on any application this app created.
         * They are mapped anyway because the record is not this app's alone: a
         * value entered through another channel would otherwise be dropped
         * silently on the one screen meant to show everything on file. The
         * review rows render them only when present, so an all-null trio costs
         * nothing on screen.
         */
        dateOfBirth: toDisplayDate(aadhaar.dateOfBirth) ?? '',
        gender: aadhaar.gender ?? '',
        address: aadhaar.address ?? '',
        aadhaarFrontImageKey: aadhaar.frontDocumentKey ?? null,
        aadhaarBackImageKey: aadhaar.backDocumentKey ?? null,
      },

      /**
       * `contentType` and `sizeBytes` also come back on the selfie and are
       * deliberately not carried: the blob fetched for the thumbnail reports
       * its own type, and nothing on this screen shows a file size. Adding
       * them would be two fields kept correct for no reader.
       */
      selfie: { selfieKey: selfie.documentKey ?? null },

      bank: {
        accountType: bank.accountType ?? '',
        accountHolder: bank.accountHolderName ?? '',
        accountNumber: bank.accountNumber ?? '',
        ifsc: bank.ifscCode ?? '',
        bankName: bank.bankName ?? '',
        branchName: bank.branchName ?? '',
        passbookImageKey: bank.passbookDocumentKey ?? null,
        chequeImageKey: bank.chequeDocumentKey ?? null,
      },

      education: {
        highestQualification: education.highestQualification ?? '',
        institutionName: education.institutionName ?? '',
        boardOrUniversity: education.boardOrUniversity ?? '',
        passingYear: education.passingYear ?? '',
        certificateImageKey: education.certificateDocumentKey ?? null,
      },

      business: {
        /**
         * Unlike `hasGst` below, this is *not* a strict `=== true` check.
         *
         * A record written before the step asked the question has no
         * `hasBusiness` at all, and reading that absence as "no business"
         * would wipe a filled-in type and name off the review screen and out
         * of the editor. So an explicit boolean wins, and only when there
         * isn't one does the presence of a business name stand in for the
         * answer — the same fallback `BusinessStep` seeds its gate with.
         */
        hasBusiness:
          typeof business.hasBusiness === 'boolean'
            ? business.hasBusiness
            : Boolean(business.businessName || business.businessType),
        businessType: business.businessType ?? '',
        businessName: business.businessName ?? '',
        addressLine1: business.addressLine1 ?? '',
        addressLine2: business.addressLine2 ?? '',
        city: business.city ?? '',
        state: business.state ?? '',
        pincode: business.pincode ?? '',
        hasGst: business.hasGst === true,
        gstIn: business.gstIn ?? '',
      },
    },
  };
}

/** Everything on the application, for the Review screen. */
export async function fetchReviewDetails() {
  const response = await api.get(ENDPOINTS.onboarding.getReviewDetails);
  return normalizeReview(unwrap(response) ?? {});
}

/**
 * The bytes behind a document key.
 *
 * `responseType: 'blob'` and no `unwrap` — this route answers with the file
 * itself, not the `{ success, data }` envelope every other route uses. (The
 * response interceptor's `success === false` check is harmless here: a Blob has
 * no such property, so it falls straight through.)
 *
 * Returns a Blob, which is what `URL.createObjectURL` wants. The caller owns
 * revoking the URL it makes.
 */
export async function fetchDocumentBlob(key) {
  const response = await api.get(ENDPOINTS.onboarding.getDocument(key), {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Hand the finished application to the review team.
 *
 * No payload. Everything was saved a step at a time, so there is nothing left
 * to send — the bearer token says which application to submit, and the server
 * already holds all of it. That is also why this cannot be a local flag flip:
 * the server decides whether the application is complete enough to accept, and
 * a client that assumed yes would leave someone believing they had applied.
 *
 * `null` is passed explicitly as the body, matching `logout` — axios would
 * otherwise send no body at all, which some ASP.NET routes answer with a 415.
 *
 * `reference` is the one field worth putting in front of the user: it is what
 * they would quote if they ever had to ask about their application.
 */
export async function submitApplication() {
  const response = await api.post(ENDPOINTS.onboarding.submitApplication, null);
  const data = unwrap(response) ?? {};

  return {
    applicationId: data.applicationId ?? null,
    pospId: data.pospId ?? null,
    reference: data.reference ?? null,
    status: data.status ?? null,
    /** The server's own wording for what just happened, when it sends one. */
    message: data.message ?? null,
    submittedAt: data.submittedAt ?? null,
  };
}
