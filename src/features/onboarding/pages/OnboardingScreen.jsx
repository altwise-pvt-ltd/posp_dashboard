import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Home, Loader2, RotateCcw } from "lucide-react";
import { showAlert } from "@/shared/store/alertStore";
import { completeOnboarding } from "@/shared/store/onboardingStore";
import { useOnboardingStatusStore } from "@/shared/store/onboardingStatusStore";
import { submitForReview } from "@/shared/store/verificationStore";
import FunnelLayout, { FUNNEL_SHELL } from "@/shared/layouts/FunnelLayout";
import { STEPS, REVIEW_INDEX } from "../model/steps";
import { submitApplication } from "../api/onboardingApi";
import Stepper from "../components/Stepper";
import OnboardingSidebar from "../components/OnboardingSidebar";
import StepPlaceholder from "../components/StepPlaceholder";
import PanStep from "../steps/PanStep";
import EmailStep from "../steps/EmailStep";
import AadhaarStep from "../steps/AadhaarStep";
import SelfieStep from "../steps/SelfieStep";
import BankStep from "../steps/BankStep";
import EducationStep from "../steps/EducationStep";
import BusinessStep from "../steps/BusinessStep";
import ReviewStep from "../steps/ReviewStep";

/**
 * OnboardingScreen — wizard scaffold.
 * Owns layout and this sitting's form data; the step list lives in
 * `../model/steps` and the position lives in `onboardingStatusStore`.
 *
 * Flow (0-indexed):
 *   0  PAN Details  →  1  Email Verify  →  2  Aadhaar
 *   3  Selfie       →  4  Bank Account  →  5  Education
 *   6  Business     →  7  Review & Submit
 *
 * Resuming:
 *   The step is *not* local state seeded at 0 any more. It comes from
 *   `GET /onboarding/status`, which the sign-in handler has usually already
 *   fetched — `ensureLoaded()` below covers the other way in (a refresh, or a
 *   direct link) and costs nothing when it hasn't. So a POSP who leaves halfway
 *   and comes back a week later on a different device opens on the step they
 *   stopped at, with the ones behind it ticked.
 *
 * Responsive layout:
 *   - The content shell grows with the viewport (max-w-7xl → wider on 2xl) so
 *     big screens fill space instead of stranding the form in side whitespace.
 *   - Form + sidebar are a CSS grid: a single stacked column up to `lg`, then
 *     two columns (fluid form + fixed-ish sidebar) from `lg:` up.
 *   - The Review step spans the full width (single column) — its cards tile
 *     into their own grid and the sidebar is dropped to give them room.
 */

// Per-step success toast copy, keyed by the same key used in saveAndNext.
// Keeps the messages tailored without scattering showAlert calls into each step.
const STEP_SAVED_ALERTS = {
  pan:       { title: "PAN details saved",   message: "Your PAN information was captured." },
  email:     { title: "Email verified",      message: "Your email address is confirmed." },
  aadhaar:   { title: "Aadhaar saved",       message: "Your Aadhaar details were captured." },
  selfie:    { title: "Selfie added",        message: "Your selfie was captured successfully." },
  bank:      { title: "Bank account added",  message: "Your bank details were saved." },
  education: { title: "Education saved",     message: "Your education details were captured." },
  business:  { title: "Business saved",      message: "Your business details were captured." },
};

/** Shared wrapper for the two states that render instead of the wizard. */
function OnboardingNotice({ children }) {
  return (
    <FunnelLayout header="auto">
      <div className={`${FUNNEL_SHELL} flex min-h-[60vh] items-center justify-center py-4 sm:py-6 lg:py-8`}>
        {children}
      </div>
    </FunnelLayout>
  );
}

export default function OnboardingScreen() {
  const navigate = useNavigate();

  const status        = useOnboardingStatusStore((s) => s.status);
  const currentStep   = useOnboardingStatusStore((s) => s.stepIndex);
  const localCompleted = useOnboardingStatusStore((s) => s.localCompleted);
  const loading       = useOnboardingStatusStore((s) => s.loading);
  const error         = useOnboardingStatusStore((s) => s.error);
  const ensureLoaded  = useOnboardingStatusStore((s) => s.ensureLoaded);
  const refresh       = useOnboardingStatusStore((s) => s.refresh);
  const goToStep      = useOnboardingStatusStore((s) => s.goToStep);
  const markStepComplete = useOnboardingStatusStore((s) => s.markStepComplete);

  // No-ops when sign-in already fetched it on this page load; the real work
  // happens on a refresh or a direct link into /onboarding.
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  // Every step's validated payload, namespaced by step key so colliding fields
  // (PAN and Aadhaar both emit `fullName`) never overwrite each other.
  //
  // Still local to this sitting: once each step POSTs its own data the server
  // becomes the record and this shrinks to the form buffer it already is.
  const [formData, setFormData] = useState({});

  const goNext = () => goToStep(currentStep + 1);

  // Forward flow: store this step's data under its key, then advance.
  const saveAndNext = (key) => (data) => {
    setFormData((prev) => ({ ...prev, [key]: data }));
    // Ticks the stepper immediately. Once this step has an endpoint, the call
    // goes here and `refresh()` replaces the optimistic mark with the
    // server's own.
    markStepComplete(key);
    const saved = STEP_SAVED_ALERTS[key] ?? {
      title: "Step saved",
      message: "Your details were saved.",
    };
    showAlert({ variant: "success", ...saved });
    goNext();
  };

  // Skip an optional step: drop any saved data for it, then advance. No
  // markStepComplete — a skipped step is not a finished one, and the stepper
  // should keep saying so.
  const skipAndNext = (key) => () => {
    setFormData((prev) => {
      // Deleted rather than left out of a rest destructure, which lints as an
      // unused binding under this config.
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
    showAlert({
      variant: "info",
      title: "Step skipped",
      message: "You can add these details later from your profile.",
    });
    goNext();
  };

  // Inline edit on the Review screen: overwrite one section without navigating.
  const updateSection = (key, data) =>
    setFormData((prev) => ({ ...prev, [key]: data }));

  /**
   * Submit the application, then unlock everything downstream — in that order.
   *
   * Nothing is sent from `formData`: each step already POSTed its own details,
   * so the server holds the application and `POST /onboarding/submit` needs no
   * payload at all. What matters here is the ordering. The two store calls
   * below flip local flags that the route guards read, and doing that before
   * the server has accepted the submission — as this used to, unconditionally —
   * would let someone through to the waiting screen with an application that
   * was never actually submitted, and no way back into the wizard to fix it.
   *
   * So a failure returns nothing and changes nothing: the toast explains, and
   * the user is left on Review with the button live again.
   */
  const handleSubmit = async () => {
    let result;
    try {
      result = await submitApplication();
    } catch (error) {
      showAlert({
        variant: error.isValidation ? "warning" : "error",
        title: "Couldn't submit your application",
        message: error.message,
      });
      // Refresh so Review re-reads the server's verdict — a rejection here is
      // usually the server naming something still incomplete, and the Review
      // screen's blocking reasons are where the user can act on it.
      refresh();
      return;
    }

    // Mark onboarding done — this flips the localStorage flag the route guard
    // reads, which is what unlocks everything downstream from here on.
    completeOnboarding();
    // Put the profile in the review queue. Matters most on a *re*submission:
    // a POSP the team sent back arrives here still flagged as rejected, and
    // without this they'd fix their PAN and land on the rejection screen again,
    // still being told about the old verdict.
    submitForReview();
    // The AlertContainer lives above <Routes>, so this success toast survives
    // the navigation and greets the user on the verification page.
    showAlert({
      variant: "success",
      title: "Application submitted",
      // The server's own wording when it sends one, and the reference number
      // alongside it — that is the string the user would quote if they ever
      // needed to ask about this application.
      message: [
        result.message ?? "Your details are with our team — we'll verify them shortly.",
        result.reference ? `Reference: ${result.reference}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    });
    // Application submitted — hand the user off to the waiting screen. Training
    // opens once the team verifies, and the dashboard after the exam.
    navigate("/verification");
  };

  // Skip the entire onboarding wizard and jump straight to the waiting screen.
  // No step data is submitted; the user can finish these details later from
  // their profile. Same destination as handleSubmit, minus the submit — and
  // deliberately without submitForReview(): nothing was fixed, so a rejected
  // profile stays rejected rather than rejoining the queue on a skip.
  const skipAll = () => {
    // Still flip the flag — otherwise the funnel guard bounces them straight
    // back here and Skip becomes a no-op. The server still reports the
    // application incomplete, which is correct and is why the status store only
    // ever syncs this flag on, never off.
    completeOnboarding();
    showAlert({
      variant: "info",
      title: "Onboarding skipped",
      message: "You can complete your details anytime from your profile.",
    });
    navigate("/verification");
  };

  /* ── Pre-wizard states ──────────────────────────────────────────────────
     Only when there is nothing to draw. A restored status paints straight
     through and revalidates behind the user; a failed *re*validation likewise
     leaves the wizard alone rather than replacing work-in-progress with an
     error card. */

  if (!status && loading) {
    return (
      <OnboardingNotice>
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={28} strokeWidth={2.5} className="animate-spin text-brand" />
          <p className="text-sm font-medium">Picking up where you left off…</p>
        </div>
      </OnboardingNotice>
    );
  }

  if (!status && error) {
    return (
      <OnboardingNotice>
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Couldn't load your application
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {error.message ??
              "We couldn't reach the server to check your progress."}
          </p>
          {/* Starting the wizard blind would risk asking for details already on
              file, so this offers the retry instead of guessing at step 1. */}
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <RotateCcw size={14} strokeWidth={2.5} className={loading ? "animate-spin" : undefined} />
            {loading ? "Retrying…" : "Try again"}
          </button>
        </div>
      </OnboardingNotice>
    );
  }

  // The Review step goes full-width (its cards tile into a grid), so the
  // illustration sidebar is dropped there to give them room.
  const isReview = currentStep === REVIEW_INDEX;

  /* What the stepper ticks. The server's record and this sitting's progress are
     unioned rather than merged upstream, so a step the user just filled in
     shows as done without the store having to pretend the server said so. */
  const completed = new Set([
    ...(status?.completedKeys ?? []),
    ...localCompleted,
  ]);

  const stepperSteps = (status?.steps ?? STEPS).map((step, i) => ({
    label: step.label,
    title: step.title,
    status: completed.has(step.key)
      ? "completed"
      : i === currentStep
        ? "in_progress"
        : "pending",
  }));

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <PanStep onNext={saveAndNext("pan")} />;
      case 1: return <EmailStep onNext={saveAndNext("email")} />;
      case 2: return <AadhaarStep onNext={saveAndNext("aadhaar")} />;
      case 3: return <SelfieStep onNext={saveAndNext("selfie")} />;
      case 4: return <BankStep onNext={saveAndNext("bank")} />;
      case 5: return <EducationStep onNext={saveAndNext("education")} />;
      case 6: return <BusinessStep onNext={saveAndNext("business")} onSkip={skipAndNext("business")} />;
      case 7: return <ReviewStep data={formData} onUpdateSection={updateSection} onSubmit={handleSubmit} />;
      default: return <StepPlaceholder step={STEPS[currentStep]} onNext={goNext} />;
    }
  };

  return (
    <FunnelLayout header="auto">
      {/* Content shell — caps at 7xl on most screens, widens on very large ones.
          Vertical padding is the wizard's own; FUNNEL_SHELL carries the width
          and the side padding it shares with the rest of the funnel. */}
      <div className={`${FUNNEL_SHELL} py-4 sm:py-6 lg:py-8`}>

          {/* Progress stepper */}
          <div className="anim-fade mb-4 lg:mb-5 mx-auto w-full max-w-5xl xl:max-w-6xl">
            <Stepper steps={stepperSteps} activeIndex={currentStep} />
          </div>

          {/* Breadcrumb + Skip-all shortcut */}
          <div className="anim-fade-d1 mb-4 flex flex-wrap items-center justify-between gap-3">
            <nav
              aria-label="Breadcrumb"
              className="inline-flex items-center gap-1.5 text-sm rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5"
            >
              <a
                href="https://www.letsinsurance.com/"
                className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-orange-500 transition-colors duration-200"
              >
                <Home size={14} strokeWidth={2} />
                Home
              </a>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="font-semibold text-slate-700">On Boarding</span>
            </nav>

            {/* Skip the whole wizard — lands on verification without submitting. */}
            <button
              type="button"
              onClick={skipAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:border-orange-200 hover:text-orange-600"
            >
              Skip for now
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Form + Sidebar — single column on mobile, two columns from lg up.
              Form track is fluid (it grows with the viewport); the sidebar track
              is a roomy fixed-ish width. Review spans the whole width instead. */}
          <div
            className={
              "mx-auto w-full grid grid-cols-1 gap-12 items-start justify-center " +
              (isReview
                ? "max-w-4xl xl:max-w-7xl"
                : "lg:grid-cols-[auto_27.5rem] xl:grid-cols-[auto_30.5rem] lg:max-w-max")
            }
          >
            <div className="anim-fade-d2 min-w-0 w-full">
              {renderStep()}
            </div>
            {!isReview && <OnboardingSidebar />}
          </div>

      </div>
    </FunnelLayout>
  );
}
