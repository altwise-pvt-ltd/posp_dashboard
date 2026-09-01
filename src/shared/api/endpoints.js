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
     * GET (bearer) ?insurnaceTypeId=3 → the study material: an array of courses,
     * each `{ id, name, description, insuranceTypeId, displayOrder, subModules }`,
     * every sub-module carrying `chapters` of
     * `{ id, title, description, displayOrder, hasPdf, pdfFileName,
     *    pdfFileSizeBytes, pdfUrl }`.
     *
     * This is what a POSP actually reads during the mandated hours. It replaced a
     * hardcoded `trainingModules.js` whose chapters were all named "Chapter 1"
     * and all linked to '#'.
     *
     * ⚠ `insurnaceTypeId` is spelled exactly like that — the typo is the
     * server's and the parameter is matched on it, so correcting it here would
     * silently stop identifying the line.
     *
     * ⚠ And the server does not currently read it: ids 1, 2, 99 and the
     * parameter left off entirely all answer with *every* course. The id is sent
     * anyway, so this starts working the day the backend honours it. Nothing on
     * the app side narrows the reply any more — `fetchCourseMaterial` renders
     * every course it is given, so until the server filters, a Life-only POSP
     * sees the general syllabus too.
     *
     * ⚠ Most chapters come back `hasPdf: false` with a null `pdfUrl`. They are
     * still part of the syllabus and still rendered — as unpublished rows, not
     * as links. See `normalizeChapter` in `posp-training/api/courseApi.js`.
     *
     * ⚠ `pdfUrl` is **relative and app-rooted** — `/api/lms/chapter/{id}/pdf`,
     * served by this same API behind the bearer token. It used to be an absolute
     * public URL on `ibms.shrisoft...`, and code written against that is now
     * wrong twice over: dropped into an `href` it resolves against *this app's*
     * origin, and even prefixed with the API host a plain anchor sends no
     * Authorization header. It needs the same blob-fetch dance as
     * `onboarding.getDocument`.
     */
    course: "/lms/course",

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
     * POST (bearer) { insuranceTypeId } → creates the training record and
     * replies with it: `{ trainingId, pospId, insuranceTypeId,
     * insuranceTypeName, requiredHours, completedHours, remainingHours,
     * status: "Applied", isTrainingCompleted, appliedDate, trainingStartDate }`.
     *
     * Sent with the same body and immediately after `selectInsuranceType` — the
     * selection names the line, this one enrols against it. The reply is the
     * same shape `progress` returns, so the plan the choice screen leaves behind
     * is the server's own record rather than a local echo of the tapped option.
     *
     * `status` is `Applied` and `trainingStartDate` is null: enrolled, hours not
     * running. `start-training` is what moves both.
     */
    applyForTraining: "/lms/apply-for-training",

    /**
     * POST (bearer, no body) → records that this POSP accepted the terms
     * governing the programme. Replies with the same training record as
     * `startTraining`, so the acceptance is stored against the training, not the
     * session.
     *
     * A consent, so it is deliberately its own call rather than a flag on
     * `start-training`: the server has to be able to say *when* it was given,
     * independently of whether the hours were ever begun.
     */
    acceptTerms: "/lms/accept-terms",

    /**
     * POST (bearer, no body) → records acceptance of the training norms — the
     * rules about how the mandated hours must be served.
     *
     * Separate from `acceptTerms` because they are two documents and the server
     * stamps them separately. Both are required before `start-training`.
     */
    acceptTrainingNorms: "/lms/accept-training-norms",

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
     * the course lives on the LMS's own domain — `requestTrainingAccess` in
     * `posp-training/api/trainingApi.js` picks it up when it's there and falls
     * through to the in-app route when it isn't.
     *
     * ⚠ The app-side function is `requestTrainingAccess`, not `verifyForTraining`:
     * this endpoint's "verify" is the LMS granting a seat, which has nothing to
     * do with the KYC verification the rest of the app means by the word. The key
     * here stays named after the path.
     */
    verifyForTraining: "/lms/verify-for-training",

    /**
     * GET (bearer) → this POSP's training record: which line they enrolled in,
     * the mandated hours, how many are served, and when it began.
     *
     * The read-back the app was missing. Every other LMS call writes — the line
     * was POSTed to `selectInsuranceType` and then only ever remembered in
     * localStorage, so a POSP on a second device was asked to choose all over
     * again while the server held the answer. This is that answer.
     *
     * Takes the **POSP** id, not the user id: `user.id` on the verify reply
     * identifies the login, `profile.id` from `/posp/me` identifies the POSP
     * row, and it is the latter the LMS files training under. They are different
     * uuids for the same person and swapping them 404s.
     */
    progress: (pospId) => `/lms/progress/${encodeURIComponent(pospId)}`,

    /**
     * POST (bearer) { hoursToAdd } → the same training record, with the hours
     * added.
     *
     * ⚠ `hoursToAdd` is a **delta**, not a total — sending it twice counts it
     * twice. Whatever drives it has to fire on a deliberate beat, not on a
     * render.
     *
     * ⚠ The server stores what it is told and does not check it against real
     * elapsed time: a record exists in the wild with 15 hours served between a
     * start and end stamp 3½ minutes apart. Treat the returned figures as
     * authoritative for *display* — they are the LMS's own — while knowing they
     * are only as honest as the client that wrote them.
     */
    updateProgress: "/lms/update-progress",

    /**
     * POST (bearer, no body) → closes the mandated hours and replies with the
     * finished record: `completedHours` topped up to `requiredHours`,
     * `remainingHours: 0`, `progressPercentage: 100`, `status: "Completed"`,
     * `isTrainingCompleted: true`, and a `trainingEndDate` stamp.
     *
     * The counterpart to `startTraining` — that one opens the period, this one
     * closes it. Sent when the POSP presses "Start exam": the countdown running
     * out is this browser's arithmetic, and the LMS only treats the hours as
     * served once it has been told so explicitly. Without this call the exam is
     * sat against a record the server still reads as `InProgress`.
     *
     * ⚠ Send it *after* the last `update-progress` flush, not before. This is
     * what settles the count, and a delta arriving afterwards would be added on
     * top of a total the server has already declared final.
     *
     * ⚠ Not the exam result. It says the hours are done, nothing about whether
     * the paper was passed — `certificationStore` owns that.
     */
    completeTraining: "/lms/complete-training",
  },

  /**
   * The certification exam. A sibling of `lms` rather than a member of it
   * because the paths say so — these sit at `/exam/...`, not `/lms/exam/...` —
   * and because they speak about a different thing: `lms` is the mandated hours,
   * this is the paper sat once those hours are settled.
   */
  exam: {
    /**
     * GET (bearer) → `{ pospId, isEligible, alreadyPassed, reason,
     * insuranceTypeId, insuranceTypeName, nextAttemptNo }`.
     *
     * The question `/exam/start` cannot be asked safely. Starting spends an
     * attempt — it stamps the clock and increments the count — so "may this POSP
     * sit the paper?" had no answer that did not cost one. This is that answer,
     * and it is free.
     *
     * `isEligible` is the gate and `reason` is the sentence to show when it is
     * false. Both are the server's: whether a failed attempt means sitting again
     * straight away or re-applying for the training first is the examiner's rule,
     * not this app's, and hard-coding either reading here would be this browser
     * inventing an eligibility policy. Show `reason` and obey `isEligible`.
     *
     * `alreadyPassed` is the other half — a POSP who has cleared the exam has no
     * business being sold another attempt, and this is the only thing that knows.
     *
     * `nextAttemptNo` is which sitting the next start would be, so it can be
     * stated *before* the press rather than read off the attempt afterwards.
     *
     * Read-only and idempotent, unlike everything else under this key.
     */
    eligibility: "/exam/eligibility",

    /**
     * POST (bearer, no body) → opens an attempt and hands back the whole paper
     * in one reply: `{ examId, pospId, insuranceTypeId, attemptNo,
     * examStartTime, deadline, durationMinutes, remainingSeconds,
     * totalQuestions, totalMarks, status: "InProgress", questions: [{ questionId,
     * questionText, optionA, optionB, optionC, optionD, marks }] }`.
     *
     * The server starts its own clock here — `deadline` is an absolute stamp and
     * `remainingSeconds` is measured from now, so a reload does not get the
     * period back. That is exactly what `ExamCautionDialog` warns about, which is
     * why this is sent when the caution is *accepted* and not a moment earlier:
     * mounting the exam screen must not be what spends an attempt.
     *
     * `attemptNo` is the server's count of sittings, so the endpoint is not
     * idempotent — pressing "Continue to exam" twice opens two attempts.
     *
     * Nothing is sent. The token says who, and the training record already says
     * which line — `insuranceTypeId` on the reply is the server's answer, not an
     * echo. Same arrangement as `lms.startTraining` and the two accepts.
     *
     * ⚠ The questions carry no answer key, by design. Nothing in this reply can
     * grade the paper; the score has to come from the server's own submit call.
     *
     * ⚠ `VITE_API_BASE_URL` already ends in `/api`, so the path here is
     * `/exam/start` and not `/api/exam/start`.
     */
    start: "/exam/start",

    /**
     * POST (bearer) { examId, questionId, selectedAnswer } → records one answer.
     *
     * Sent on every option press rather than once at the end, which is what
     * makes the attempt survive the thing `ExamCautionDialog` warns about: the
     * answers live on the server as they are given, not in a tab that a refresh
     * empties.
     *
     * `selectedAnswer` is the **letter** — `"A"`–`"D"`, matching the `optionA`…
     * `optionD` columns the question came back in. Not the index, and not the
     * option text. `normalizeQuestion` in `posp-training/api/examApi.js` carries
     * the letter on each option for exactly this call, so nothing downstream has
     * to reconstruct it from a position in a list.
     *
     * Idempotent per question, unlike `start`: pressing B and then C leaves C on
     * file. That is what lets the runner keep its "change your answer until you
     * submit" promise without a separate update route.
     *
     * ⚠ There is no matching *clear* route. An answer, once given, cannot be
     * withdrawn — the runner's "Clear" button only empties the local view.
     */
    saveAnswer: "/exam/save-answer",

    /**
     * POST (bearer) { examId, answers: [{ questionId, selectedAnswer }] } →
     * closes the attempt and grades it.
     *
     * The whole paper in one call, and the authoritative one: `save-answer`
     * keeps the sitting safe as it goes, this is what ends it. The two overlap
     * on purpose — every answer here has almost certainly been saved already —
     * because the per-press saves are a safety net against a lost tab and this
     * is the learner saying they are finished.
     *
     * Only answered questions are sent. A question the learner never reached has
     * no letter to give, and inventing one would be answering on their behalf.
     *
     * Sent on the submit dialog's confirm *and* on the clock reaching zero: a
     * paper abandoned to the deadline is still a paper handed in, and the
     * alternative is an attempt that stays open with answers nobody graded.
     *
     * ⚠ Grading lives here and only here. The questions from `/exam/start`
     * carry no answer key, so this reply is the single source of the score.
     */
    submit: "/exam/submit",
  },

  /**
   * The certificate itself — what the passed exam entitles a POSP to.
   *
   * A sibling of `exam` for the same reason `exam` is a sibling of `lms`: the
   * paths say so (`/certificates/...`), and it speaks about a different thing.
   * The exam is an attempt with a score; this is the document that outlives it.
   */
  certificate: {
    /**
     * GET (bearer) → `{ certificateId, pospId, insuranceTypeId,
     * certificateNumber, issuedDate, expiryDate, certificateUrl, qrCodeUrl,
     * isActive, isExpired }`. Shape taken from `CertificateResponse` in the
     * API's swagger.
     *
     * What the certificate screen prints, in place of the hardcoded holder that
     * used to stand in for it. Note what is *not* here: no name, no PAN, no
     * Aadhaar, no photograph. This route describes the certificate, not the
     * person — the holder's identity comes from `posp.me`, and the screen needs
     * both calls to draw one sheet.
     *
     * `certificateNumber` is the registration number printed on the document —
     * allocated by the back office when the pass is recorded, which is why it
     * could never have been derived in the browser.
     *
     * ⚠ Answers **404** when no certificate has been issued yet, which is an
     * ordinary state and not a failure: a POSP whose pass has just been recorded
     * may reach the screen before `/certificates/generate` has run for them. See
     * `fetchMyCertificate` — it turns that one status into `null` so the screen
     * can say "being prepared" rather than "something went wrong".
     *
     * `certificateUrl` is the server's own rendering of the document, and it is
     * *the* document — the app no longer draws a sheet of its own. See
     * `fetchCertificateFile`, which resolves it either way: an absolute URL goes
     * straight to the browser, anything else is fetched through the API client
     * because the route behind it is authenticated.
     *
     * ⚠ Its form is not in the swagger — `CertificateResponse` is referenced but
     * its properties are not published — so both readings are handled rather
     * than assumed. An empty value is treated as "not rendered yet", which is
     * also what a POSP sees if the backend never populates it.
     */
    me: "/certificates/me",
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
