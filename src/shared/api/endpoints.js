export const ENDPOINTS = {
  /**
   * Reference data that isn't the onboarding application's own.
   *
   * A sibling of `onboarding` rather than a member of it because the paths say
   * so — these sit at `/master/...`, not `/onboarding/masters/...`. The two
   * groups look alike and are not: the `onboarding.masters*` lists describe
   * what *this application* may submit, while these describe India.
   */
  geography: {
    /**
     * GET → `[{ value, label }]`, all 36 states and union territories.
     *
     * Both halves of each pair are the plain name ("Maharashtra"), unlike the
     * onboarding masters lists where `value` and `label` differ in case. That
     * makes the exact string the user sees the exact string `districts` needs
     * as a query parameter — which is why the typeahead commits the server's
     * spelling rather than what was typed.
     */
    states: "/master/geography/states",

    /**
     * GET ?state=Maharashtra → `[{ value, label }]`, that state's districts.
     *
     * The `state` parameter is matched by the server on the exact name from
     * the states list. A near-miss doesn't error — it comes back as an empty
     * list, which is indistinguishable from a state that genuinely has no
     * districts, so the caller must never send free text here.
     */
    districts: "/master/geography/districts",

    /**
     * GET → `{ pincode, state, district, areas: string[] }` for one PIN.
     *
     * A lookup, not a list — the odd one out in this group. It is what makes
     * the PIN the fast path through the address fields: six digits identify a
     * state and a district outright, so the two selects below it can be filled
     * rather than asked for. `areas` are the localities inside that PIN, which
     * is a suggestion for address line 2 and nothing the form requires.
     */
    pincode: (code) => `/master/geography/pincode/${encodeURIComponent(code)}`,
  },

  auth: {
    /** POST { mobile } → onboarding the user and dispatching the SMS code. */
    requestOtp: "/onboarding/mobile/send-otp",
    /** POST { mobile } → dispatches a fresh code; 429 when throttled. */
    resendOtp: "/onboarding/mobile/resend-otp",
    /** POST { mobile, otp } → the bearer token and the user it belongs to. */
    verifyOtp: "/onboarding/mobile/verify-otp",
    /** POST → revokes the caller's token server-side. */
    logout: "/onboarding/logout",
  },

  posp: {
    /**
     * GET (bearer) → the POSP record behind the token: identity, address, bank,
     * KYC, and the RM / support contacts.
     *
     * The counterpart to `onboarding.status`, and which of the two to ask is
     * decided by `flow` on the verify-otp reply — not by trying one and falling
     * back to the other. `ONBOARDING` means the application is still being
     * filled in and only `/onboarding/status` can say where; `REGISTERED` means
     * a POSP row exists and this is the endpoint that describes it. Asking
     * `/onboarding/status` about a registered POSP answers a question nobody is
     * asking any more.
     *
     * `status` (e.g. `KycPending`) and `kycStatus` (e.g. `Submitted`) are what
     * the funnel reads — see `deriveVerification` in
     * `features/profile/api/pospApi.js`.
     */
    me: "/posp/me",
  },

  lms: {
    /**
     * GET (bearer) → `[{ id, name, requiredHours }]` — the lines a POSP may
     * train and sit the exam in: Life, General, or Both.
     *
     * `requiredHours` is per option and is what the training clock counts down
     * (15 for a single line, 30 for Both), so the mandated period is the
     * server's number rather than a constant in the page.
     */
    insuranceTypes: "/lms/insurance-types",

    /**
     * POST (bearer) { insuranceTypeId } → records the line this POSP will train
     * and be examined in.
     *
     * The commit half of the pair above. It runs before the clock starts, and a
     * failure has to keep the POSP on the choice screen — the hours only mean
     * something if the server agrees which programme they're being served
     * against.
     */
    selectInsuranceType: "/lms/select-insurance-type",

    /**
     * POST (bearer, no body) → opens the programme; the mandated hours run from
     * here.
     *
     * Its own button, not a tail on `selectInsuranceType`: choosing a line is a
     * decision, starting the clock is a commitment, and the screen between them
     * is where a POSP reads what the hours involve. Nothing is sent — the token
     * says who, and the selection call has already said which line.
     */
    startTraining: "/lms/start-training",

    /**
     * POST (bearer) → clears this POSP to begin the 15-hour programme.
     *
     * What "Start POSP training" calls before the funnel moves. The server is
     * the gate: the verification screen's own verdict says a reviewer approved
     * the profile, not that the LMS has a seat for them.
     *
     * The reply may carry a handoff URL (`redirectUrl` / `lmsUrl` / `url`) if
     * the course lives on the LMS's own domain — `verifyForTraining` in
     * `posp-training/api/trainingApi.js` picks it up when it's there and falls
     * through to the in-app route when it isn't.
     */
    verifyForTraining: "/lms/verify-for-training",
  },

  onboarding: {
    /**
     * GET (bearer) → where this application stands: the step to resume on,
     * per-step completion, and what still blocks submission.
     *
     * The resume signal. Lives under `onboarding` rather than `auth` because it
     * describes the application, not the session — the token only says which
     * application to describe.
     */
    status: "/onboarding/status",

    // Pan details submission and retrieval endpoints
    /**
     * POST multipart { panNumber, fullname, dateOfBirth, panFrontImage } → the
     * saved PAN record.
     *
     * Names and casing are copied from a request the server accepted —
     * `fullname` really is lowercase where the form field is `fullName`, and
     * `dateOfBirth` is `yyyy/MM/dd`, not the `dd/mm/yyyy` the user types. Both
     * are translated in `submitPanDetails` (onboarding/api/onboardingApi.js),
     * which is the only thing that should build this payload.
     *
     * Multipart rather than JSON because of the image field.
     */
    submitPanDetails: "/onboarding/pan/save",

    /** GET (bearer) → the PAN details already on file, or null. */
    getPanDetails: "/onboarding/pan",

    //Email verification endpoints
    /**
     * POST { email } → dispatches the code. Replies with
     * `{ message, expiresInSeconds }` — how long the *code* stays valid, which
     * is not the resend throttle; that arrives as `Retry-After` on a 429.
     *
     * Doubles as the resend: there is no separate email resend route, unlike
     * the mobile pair above.
     */
    sendEmailVerification: "/onboarding/email/send-otp",

    /**
     * POST { email, otp } → `{ isVerified, email, nextStep, verifiedAt }`.
     *
     * Both fields go in the body. This was briefly written as a function
     * putting the code in the query string, which the server answered with
     * "'Otp' must not be empty" — it binds the whole request from the body, and
     * a query parameter it never reads is indistinguishable from no code at
     * all. Confirmed against `VerifyEmailOtpRequest` in the API's swagger.
     */
    verifyEmail: "/onboarding/email/verify-otp",

    // Adhaar details submission and retrieval endpoints
    /** POST (bearer) → the saved Aadhaar record. */
    submitAadhaarDetails: "/onboarding/aadhaar/save",

    /** GET (bearer) → the Aadhaar details already on file, or null. */
    getAadhaarDetails: "/onboarding/aadhaar",

    /**
     * POST multipart { selfieImage } → `{ documentKey, contentType, sizeBytes,
     * isCompleted }`. The image is the only part; there is nothing else to send.
     */
    uploadProfilePicture: "/onboarding/selfie/save",

    /**
     * GET → `[{ value, label }]`, the account types the bank step may submit.
     *
     * Fetched rather than hardcoded because `value` and `label` differ in case:
     * the server stores `SAVINGS` and displays `Savings`. A form that submitted
     * what it rendered would send the label, and one that lowercased its own
     * constants — as this step used to — would send `savings`. Reading the pair
     * from here removes the guess entirely.
     *
     * Unauthenticated, like the other masters lists.
     */
    getBankTypes: "/onboarding/masters/account-types",

    /**
     * POST multipart → `{ detailsId, saved, nextStep, completedAt }`.
     *
     * Field names are the server's and differ from the form's on three counts —
     * `accountHolderName`, `ifscCode` and `cancelledChequeImage`. The mapping
     * lives in `saveBankDetails` (onboarding/api/onboardingApi.js).
     *
     * ⚠ Both images are required on *every* save, including an update — the
     * server has no "keep what's on file" mode, so a re-save without them is
     * rejected.
     */
    saveBankDetails: "/onboarding/bank/save",

    /**
     * GET(bearer) -qualification types(ssc,hsc...etc) for the education step
     */
    getQualificationTypes: "/onboarding/masters/qualifications",

    /** POST(bearer,and payload for Education) upload the  education detailseducation detials  */
    saveEducationDetails: "/onboarding/education/save",

    /** GET(bearer) -Business Types topopulate the dropdown of business */
    getBusinessTypes: "/onboarding/masters/business-types",

    /** POST(bearer,and payload for Business) upload the  business details */
    saveBusinessDetails: "/onboarding/business/save",

    /** GET (bearer) get the review details of the user */
    getReviewDetails: "/onboarding/review",

    /**
     * GET (bearer) → the raw bytes of one uploaded document.
     *
     * Needed because `getReviewDetails` returns *keys*, not files — without
     * this the review screen has nothing to draw a thumbnail from for anyone
     * who didn't upload in the current sitting.
     *
     * ⚠ Authenticated, so the URL cannot go straight into an `<img src>`: the
     * browser sends no Authorization header on an image request. It has to be
     * fetched as a blob through the axios client and turned into an object URL
     * — which is what `fetchDocumentBlob` does.
     */
    getDocument: (key) => `/onboarding/documents/${encodeURIComponent(key)}`,

    /** POST(beearer)-> submit the application */
    submitApplication: "/onboarding/submit",
  },
};
