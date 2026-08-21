export const ENDPOINTS = {
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
