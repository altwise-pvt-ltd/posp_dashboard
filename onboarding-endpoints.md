# Every API this app calls, in the order a user hits them

Covers the whole funnel, not just onboarding: **sign-in → onboarding wizard → verification → dashboard → training → exam → certificate → offline quotation.**

---

## Before you read the tables

**Base URL** — every path below is glued onto `VITE_API_BASE_URL`, which is `https://ibmsapi.shrisoft.co.in/api`. It **already ends in `/api`**, so a row that says `/exam/start` really goes to `…/api/exam/start`. Never write `/api/...` in the path yourself.

**Login token** — after sign-in the app holds a bearer token and `src/shared/api/client.js` attaches it to *every* request automatically. You never add it by hand. Rows marked 🔓 work without it (they're the only ones that do).

**Reply shape** — almost everything comes back wrapped as `{ success: true, data: … }` and the app pulls `data` out for you (`unwrap`). The two exceptions are file downloads, which return raw bytes.

**How to read the "Trigger" column** — it's the exact thing that makes the request leave the browser. Three kinds:

| You'll see | It means |
| --- | --- |
| 👆 *User taps …* | A button press. Nothing goes out until someone clicks. |
| 📄 *Screen opens …* | Fires by itself when the page loads (and again on a browser refresh). |
| ⏱ *Timer / typing …* | Fires on a clock or after the user stops typing. Nobody presses anything. |

**"Sends" column** — `JSON` is a normal request body. `multipart/form-data` means there's a **file** in it, so the body is built with `FormData` and the browser sets the Content-Type itself. `nothing` means the token alone identifies the user.

---

## The journey at a glance

```
1. Sign in            mobile → OTP → token
2. Onboarding wizard  8 steps, each step saves itself as you go
3. Submit             hands the application to the back office
4. Verification       waiting room until a human approves
5. Dashboard          profile, photo, side nav
6. Training (LMS)     pick a line → consent → clock runs → hours reported
7. Exam               eligibility → start → answer → submit → graded
8. Certificate        the document you earned
9. Offline quotation  product catalogue → server-driven form
```

---

## 1 · Sign in / Sign up

Files: `features/auth/api/authApi.js`, `features/auth/components/LoginForm.jsx`, `shared/auth/resumeSession.js`

| # | Trigger — what makes it fire | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 1.1 | 👆 User types a 10-digit mobile and taps **Start Earning Now** | POST 🔓 | `/onboarding/mobile/send-otp` | JSON `{ mobile }` |
| 1.2 | 👆 User taps **Resend code** (button stays disabled until the countdown reaches 0) | POST 🔓 | `/onboarding/mobile/resend-otp` | JSON `{ mobile }` |
| 1.3 | 👆 User types the 6-digit SMS code and taps **Verify & Continue** | POST 🔓 | `/onboarding/mobile/verify-otp` | JSON `{ mobile, otp }` |
| 1.4 | 📄 Immediately after 1.3 succeeds, **if** the reply says `flow: ONBOARDING` or `CORRECTION` (they're still filling the form) | GET | `/onboarding/status` | nothing |
| 1.5 | 📄 Immediately after 1.3 succeeds, **if** the reply says `flow: REGISTERED` (they already finished and were approved) | GET | `/posp/me` | nothing |
| 1.6 | 👆 Sign out — **wired in code but there is no button on screen yet**; today only the console helper `Denied()` reaches it | POST | `/onboarding/logout` | `null` |

**Notes for a first-timer**

- 1.1 and 1.2 hit *different* URLs on purpose — the server throttles them separately. A blocked resend comes back **429** with a `Retry-After` header, and that number is what drives the on-screen countdown.
- 1.3 is the only call that returns the **token**. If the reply has no token, the app throws on the spot rather than continuing with a dead session.
- 1.4 vs 1.5 is not trial-and-error. The `flow` field on the 1.3 reply decides which one to ask, and only one of them is ever sent.

---

## 2 · Onboarding wizard

Files: `features/onboarding/api/onboardingApi.js`, `features/onboarding/steps/*`

The wizard is **forward-only**. Every step saves itself when you press Continue; corrections happen later, on the Review screen.

### 2.0 · Opening the wizard

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 2.0 | 📄 The `/onboarding` screen opens — a fresh visit or a browser refresh | GET | `/onboarding/status` | nothing |

This is the **resume** call. Progress lives on the server, not in this browser, so this is the only thing that knows which step to drop the user on.

### Step 1 · PAN

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 2.1 | 👆 User fills PAN + name + DOB, attaches the card photo, taps **Continue** (same call for **Save** when editing from Review) | POST | `/onboarding/pan/save` | `multipart/form-data`: `panNumber`, `fullname`, `dateOfBirth`, `panFrontImage` |

- `fullname` really is all-lowercase here, and `dateOfBirth` goes up as `yyyy/MM/dd` even though the user typed `dd/mm/yyyy`. Both conversions happen in `submitPanDetails` — don't build this body anywhere else.
- `dateOfBirth` is optional to the server; the form asks for it anyway.
- The server also accepts `panBackImage` (and returns `backDocumentKey` on review). A PAN card has no details on its back, so the UI neither collects nor renders it.

### Step 2 · Email

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 2.2 | 👆 User types an email and taps **Send code** | POST | `/onboarding/email/send-otp` | JSON `{ email }` |
| 2.3 | 👆 User taps **Resend code** — *same URL as 2.2*, there is no separate resend route for email | POST | `/onboarding/email/send-otp` | JSON `{ email }` |
| 2.4 | 👆 User types the 6-digit email code and taps **Verify** | POST | `/onboarding/email/verify-otp` | JSON `{ email, otp }` |

- The 2.2 reply carries `expiresInSeconds`. That's how long the **code** stays valid — it is *not* a resend cooldown. Don't lock the resend button with it.
- On 2.4 both fields go in the **body**. Putting the OTP in the query string makes the server answer `"'Otp' must not be empty"`.

### Step 3 · Aadhaar

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 2.5 | 👆 User fills the Aadhaar details, attaches front + back photos, taps **Continue** / **Save** | POST | `/onboarding/aadhaar/save` | `multipart/form-data`: `aadhaarNumber` (12 digits, spaces stripped), `fullName`, `dateOfBirth`, `gender`, `address`, `aadhaarFrontImage`, `aadhaarBackImage` |

- The input shows `XXXX XXXX XXXX` for readability; the spaces are removed before sending.
- Note `fullName` is camelCase here and lowercase `fullname` on PAN. That's the server's inconsistency, not a typo to "fix".

### Step 4 · Selfie

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 2.6 | 👆 User takes or attaches a photo and taps **Continue** / **Save** | POST | `/onboarding/selfie/save` | `multipart/form-data`: `selfieImage` |

This is the one upload with a visible progress bar — it's a single large file with nothing else on screen.

### Step 5 · Bank

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 2.7 | 📄 The bank step opens — the **Account type** dropdown has to be filled | GET 🔓 | `/onboarding/masters/account-types` | nothing |
| 2.8 | 👆 User fills the account details, attaches passbook + cancelled cheque, taps **Continue** / **Save** | POST | `/onboarding/bank/save` | `multipart/form-data`: `accountNumber`, `accountHolderName`, `ifscCode`, `bankName`, `branchName`, `accountType`, `passbookImage`, `cancelledChequeImage` |

- Submit the dropdown's `value` (`SAVINGS`), never its label (`Savings`). That's why the list is fetched instead of hardcoded.
- ⚠ **Both images must be sent on every save, including an edit.** The server has no "keep the file you already have" mode.
- `confirmAccountNumber` never leaves the browser — it's a check on the typist, not a fact about the account.

### Step 6 · Education

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 2.9 | 📄 The education step opens — the **Qualification** dropdown has to be filled | GET 🔓 | `/onboarding/masters/qualifications` | nothing |
| 2.10 | 👆 User picks a qualification (plus optional institute / year / certificate) and taps **Continue** / **Save** | POST | `/onboarding/education/save` | `multipart/form-data`: `highestQualification`, `institutionName`, `boardOrUniversity`, `passingYear`, `certificateImage` |

Only `highestQualification` is required. Empty optionals are **left out** of the body entirely rather than sent blank, so "not provided" stays different from "cleared".

### Step 7 · Business & address

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 2.11 | 👆 User answers **Yes** to "Do you own a business?" — only then does the business-type dropdown need filling | GET 🔓 | `/onboarding/masters/business-types` | nothing |
| 2.12 | 👆 User answers the question either way (Yes **or** No) — the address block appears and its **State** dropdown needs filling | GET 🔓 | `/master/geography/states` | nothing |
| 2.13 | 👆 User picks a state — a district list only means anything inside one state | GET 🔓 | `/master/geography/districts?state=Maharashtra` | nothing (state name in the query string) |
| 2.14 | ⏱ User has typed all **6 digits** of the PIN code and stopped typing for **400 ms** | GET 🔓 | `/master/geography/pincode/{pincode}` | nothing |
| 2.15 | 👆 User taps **Continue** / **Save** | POST | `/onboarding/business/save` | JSON `{ hasBusiness, businessType, businessName, addressLine1, addressLine2, city, state, pincode, hasGst, gstIn }` |

- 2.13 matches on the **exact** state name from 2.12. A misspelling doesn't error — it returns an empty list, which looks identical to "this state has no districts". So only ever send a name the server itself gave you.
- 2.14 is the shortcut: six digits fill in the state and district for the user, and suggest localities for address line 2.
- 2.15 is the **only** step that sends JSON instead of multipart — it's the only step with no file to attach.
- When `hasBusiness` is false, `businessType` and `businessName` are forced to `null`. When `hasGst` is false, `gstIn` is forced to `null`. The record can never say "no business" while carrying a business name.

### Step 8 · Review & submit

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 2.16 | 📄 The Review screen opens — and again after every inline edit is saved | GET | `/onboarding/review` | nothing |
| 2.17 | 📄 For each document thumbnail that needs drawing — one call per stored file | GET | `/onboarding/documents/{key}` | nothing (`responseType: 'blob'`) |
| 2.18 | 👆 User taps **Edit** on a section that already has uploaded files — the old files are pulled back down so an unchanged document doesn't have to be re-picked | GET | `/onboarding/documents/{key}` | nothing (`responseType: 'blob'`) |
| 2.19 | 👆 User edits a section and taps **Save** — this re-sends that step's own save call (rows 2.1, 2.4, 2.5, 2.6, 2.8, 2.10, 2.15) | POST | that step's endpoint | same body as the step |
| 2.20 | 👆 User taps **Submit application** | POST | `/onboarding/submit` | `null` (an explicit empty body — axios would otherwise send none and ASP.NET answers that with 415) |
| 2.21 | 📄 Right after 2.20 succeeds, to pick up the new status | GET | `/onboarding/status` | nothing |

**Why documents are two calls, not one**

`/onboarding/review` gives back document **keys** (`onboarding/<app>/pan/front/<guid>.jpg`), not images. To show a thumbnail you fetch the bytes at 2.17.

⚠ You **cannot** put that URL straight into an `<img src="…">` — the browser sends no `Authorization` header on an image request, so it 401s. It has to go through the axios client as a blob and become an object URL. `fetchDocumentBlob` does this, and caches by key so the same file is never fetched twice (both the mobile and desktop layouts are mounted at once, so uncached this would be ~15 requests per visit).

2.20 sends nothing because everything was already saved a step at a time. The token says which application to submit.

---

## 3 · Waiting for verification

File: `features/verification/pages/VerificationPendingPage.jsx`

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 3.1 | 👆 User taps **Start POSP training** on the "verification complete" card | POST | `/lms/verify-for-training` | nothing |

The name is confusing and worth reading twice: this "verify" means **the LMS granting a seat on the course**, not the KYC approval the rest of the app means by "verification". An approved profile is not the same as a seat.

The reply *may* carry a handoff URL (`redirectUrl` / `lmsUrl` / `url`). If it does, the course lives on another domain and the user goes there; if it doesn't, the app routes to `/posp-training` internally.

---

## 4 · Dashboard shell & profile

Files: `shared/layouts/DashboardLayout.jsx`, `features/profile/*`

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 4.1 | 📄 Any dashboard page opens — the top bar needs the name and photo. Skipped if sign-in already loaded it | GET | `/posp/me` | nothing |
| 4.2 | 📄 The avatar needs drawing and all we have is `profileImagePath`, which is a document **key** | GET | `/onboarding/documents/{key}` | nothing (`responseType: 'blob'`) |
| 4.3 | 📄 The Profile page opens | GET | `/posp/me` | nothing |
| 4.4 | 📄 The Profile page's certificate preview box mounts | GET | `/certificates/me` | nothing |

- 4.1/4.3 use `ensureLoaded`, not `refresh` — if the profile is already in the store the call is skipped entirely, and simultaneous callers share one request rather than racing.
- ⚠ `/posp/me` gives you **two different ids**. `profile.id` is the **POSP** id (what the LMS files training under); `user.id` from sign-in is the **login** id. They're different UUIDs for the same person and swapping them 404s.
- 4.4 answers **404** when no certificate has been issued yet. That is an ordinary state, not a failure — the app turns it into `null` so the box can say "being prepared".

---

## 5 · Training (LMS)

Files: `features/posp-training/api/trainingApi.js`, `courseApi.js`, `pages/TrainingPage.jsx`, `hooks/useTrainingClock.js`

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 5.1 | 📄 Training page opens → look up the POSP id first | GET | `/posp/me` | nothing |
| 5.2 | 📄 …then ask where this POSP actually stands. Runs on **every** mount, because the hours move while they're elsewhere | GET | `/lms/progress/{pospId}` | nothing |
| 5.3 | 📄 Training page opens → fill the "What will you be selling?" cards | GET | `/lms/insurance-types` | nothing |
| 5.4 | 👆 User taps a line (Life / General / Both) — **call 1 of 2**, names the line | POST | `/lms/select-insurance-type` | JSON `{ insuranaceTypeId }` |
| 5.5 | 👆 …same tap — **call 2 of 2**, creates the training record and replies with it | POST | `/lms/apply-for-training` | JSON `{ insuranceTypeId }` |
| 5.6 | 📄 A line is now chosen → load the study material | GET | `/lms/course?insurnaceTypeId=3` | nothing |
| 5.7 | 👆 User ticks both consent boxes and taps **Start training** — **call 1 of 3** | POST | `/lms/accept-terms` | nothing |
| 5.8 | 👆 …same tap — **call 2 of 3** | POST | `/lms/accept-training-norms` | nothing |
| 5.9 | 👆 …same tap — **call 3 of 3**. *The mandated hours start counting from here* | POST | `/lms/start-training` | nothing |
| 5.10 | ⏱ Every **5 minutes** while the tab is visible, and once when the page is closed — reports the minutes served since the last report | POST | `/lms/update-progress` | JSON `{ hoursToAdd }` |
| 5.11 | 👆 User taps **Start exam** → flush the last minutes (5.10), then close the period | POST | `/lms/complete-training` | nothing |

**Notes for a first-timer**

- 5.2 needs 5.1 to have finished, because the URL contains the POSP id. In practice sign-in already fetched the profile, so it's one round trip, not two.
- 5.4 and 5.5 are one button press, two calls, in that order. The second one's reply is what gets saved — it carries the server's `trainingId` and `requiredHours`, so a plan built here and a plan read back on another device look identical.
- Between 5.5 and 5.9 the record reads `status: "Applied"` with no start date: **enrolled, clock not running.** Choosing a line and starting the clock are deliberately two separate presses so people can read what the hours involve first.
- ⚠ **5.10 sends a difference, not a total.** `hoursToAdd: 0.5` means "add half an hour to whatever you already have". Sending the same delta twice counts it twice, and the server does not catch it. That's why it's on a slow 5-minute beat with a one-at-a-time lock — never drive it from a render.
- ⚠ **5.11 must come after the last 5.10.** It declares the total final; a delta arriving afterwards gets added on top of a number the server already closed.
- The countdown on screen is *this browser's* arithmetic. Until 5.11 is sent the server still reads the training as `InProgress`, and an exam sat against that record isn't one the LMS has to honour.
- ⚠ `insurnaceTypeId` in 5.6 is misspelled **on the server**. Don't correct it — the parameter is matched on that exact spelling. (And the server currently ignores it anyway, so every request returns every course. Filtering to the enrolled line is a backend job.)

---

## 6 · Exam

Files: `features/posp-training/api/examApi.js`, `pages/TrainingPage.jsx`, `components/exam/ExamPortal.jsx`

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 6.1 | 📄 Training page opens — so the screen knows up front whether they've already passed or are shut out | GET | `/exam/eligibility` | nothing |
| 6.2 | 👆 User taps **Start exam** — asked again, right before an attempt can be spent | GET | `/exam/eligibility` | nothing |
| 6.3 | 👆 User reads the caution dialog and taps **Continue to exam**. *This is the press that spends an attempt* | POST | `/exam/start` | nothing |
| 6.4 | 👆 User taps an option tile — sent on **every** press, not just at the end | POST | `/exam/save-answer` | JSON `{ examId, questionId, selectedAnswer }` |
| 6.5 | 👆 User confirms **Submit**, **or** ⏱ the clock hits zero | POST | `/exam/submit` | JSON `{ examId, answers: [{ questionId, selectedAnswer }] }` |

**Notes for a first-timer**

- 6.1 and 6.2 are the same free call at two moments. 6.1 makes the page *honest* (don't show "Start exam" to someone who already passed). 6.2 keeps it *safe* — a failed sitting on another device can change the verdict while this page sits open, so the fresh answer is taken immediately before an attempt is spent.
- ⚠ **6.3 is not idempotent.** Two presses = two attempts against this POSP. The handler is guarded for exactly this reason. This is also why it fires on the caution dialog's confirm and *not* when the exam screen mounts — landing on a screen must never cost someone a sitting.
- 6.3 returns the whole paper in one reply, plus an absolute `deadline`. Trust the deadline, not `remainingSeconds` — the latter was true when the reply was written and goes stale on the wire. A reload does **not** give the time back.
- `selectedAnswer` is the **letter** `"A"`–`"D"`, matching the `optionA`…`optionD` columns. Not the index, not the option text.
- 6.4 is fired but deliberately **not awaited** before the tile lights up — an exam is timed and making the user wait on a round trip spends their seconds. A failure is reported after the fact.
- 6.4 is safe to repeat for the same question: the last letter to arrive wins. That's what lets someone change their mind. There is **no clear/undo route** — the "Clear" button only empties the local view.
- ⚠ **Grading only happens on 6.5.** The questions from 6.3 carry no answer key, by design. Nothing in the browser can score the paper.

---

## 7 · Certificate

Files: `features/posp-training/api/certificateApi.js`, `hooks/useCertificate.js`

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 7.1 | 📄 The certificate screen opens | GET | `/certificates/me` | nothing |
| 7.2 | 📄 7.1 came back with a `certificateUrl` → fetch the actual document | GET | that `certificateUrl` | nothing (`responseType: 'blob'`) |
| 7.3 | 📄 The screen also needs the holder's name and photo, which are **not** on the certificate record | GET | `/posp/me` | nothing |

- 7.1 returns the certificate's *metadata* — number, issue date, expiry, URLs. No name, no PAN, no photo. Those belong to the person, hence 7.3.
- 7.2 handles the URL two ways: if it's **absolute** (`https://…`) it's handed straight to the browser — fetching it through the API client would leak our bearer token to a host that isn't the API. Anything else is a path on our own authenticated API, so it goes through axios as a blob.
- An issued certificate with an empty `certificateUrl` is a real state, not a bug — the record exists and the file hasn't been rendered yet. Show "being prepared", don't frame a blank.

---

## 8 · Offline quotation

Files: `features/posp-dashboard/offline-quotation/api/*`, `features/dynamic-form/*`

| # | Trigger | Method | Endpoint | Sends |
| --- | --- | --- | --- | --- |
| 8.1 | 📄 The Offline Quotation page opens | GET | `/quote/catalog` | nothing |
| 8.2 | 👆 User has picked a product (and optionally a sub-product) — fetch the form to fill in | GET | `/quote/metadata?productId=<uuid>&subProductId=<uuid>` | nothing |
| 8.3 | 📄 A field in that form has a `lookupSource` and its parent field now has an answer — e.g. **Model** once a **Make** is chosen | GET | `/quote/lookup?source=MODEL&parent=<make>` | nothing |

**Notes for a first-timer**

- 8.1 returns the whole three-level tree — line of business → product → sub-product — in **one** call. There's no per-LOB route; the second and third dropdowns are narrowed from what's already in hand.
- 8.2 is what makes the quote form **dynamic**: nothing about the questions is written in the app. `controlType` on each field picks the component, `validations` carry the rules *and* their error messages, `directives` say what's hidden/required/disabled.
- ⚠ 8.2 wants the product's **uuid**, not the `code` the catalogue also carries.
- ⚠ 8.3 returns `{ value, text }` — **`text`, not `label`**. Every other list in this app returns `{ value, label }`. Easy to get wrong.
- The `directives` on 8.2 are a snapshot for the *empty* form. They're meant to be re-issued by a `rules/evaluate` call as answers come in — **that call is not built yet**, so today's directives only ever describe the blank form.

---

## Declared but not wired

These exist in `src/shared/api/endpoints.js` and are referenced in comments, but nothing in the app calls them today. Don't assume they work until someone tries them.

| Endpoint | Status |
| --- | --- |
| `GET /onboarding/pan` | Declared as `getPanDetails`. No caller — the Review screen reads PAN out of `/onboarding/review` instead. |
| `GET /onboarding/aadhaar` | Declared as `getAadhaarDetails`. Same story. |
| `POST /onboarding/logout` | Wired into `signOut()`, but no UI element calls it. Only reachable via the console helper `Denied()`. |
| `POST /quote/rules/evaluate` | Mentioned in the metadata endpoint's notes as the source of live `directives`. Not implemented on the app side. |

---

## The five mistakes that cost the most time here

1. **Putting a document key in an `<img src>`.** It 401s. Authenticated files must be fetched as a blob through the axios client and turned into an object URL. Applies to onboarding thumbnails, the profile avatar, and non-absolute certificate URLs.
2. **Sending a dropdown's label instead of its value.** The server stores `SAVINGS` and displays `Savings`. That's the entire reason those lists are fetched instead of hardcoded.
3. **Treating `hoursToAdd` as a total.** It's a delta. Sending it twice counts it twice and nothing on the server catches it.
4. **Re-saving a step without re-attaching its files.** There is no "keep what's on file" mode — most obviously on the bank step, which rejects a save missing either image.
5. **Prefixing a path with `/api`.** The base URL already ends in `/api`. Doing it again gives you `/api/api/…`.
