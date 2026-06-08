import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { showAlert } from "@/shared/store/alertStore";
import Topbar from "../components/Topbar";
import Stepper from "../components/Stepper";
import OnboardingSidebar from "../components/OnboardingSidebar";
import OnboardingFooter from "../components/OnboardingFooter";
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
 * Owns navigation state only; every form and layout piece is a component.
 *
 * Flow (0-indexed):
 *   0  PAN Details  →  1  Email Verify  →  2  Aadhaar
 *   3  Selfie       →  4  Bank Account  →  5  Education
 *   6  Business     →  7  Review & Submit
 *
 * Responsive layout:
 *   - The content shell grows with the viewport (max-w-7xl → wider on 2xl) so
 *     big screens fill space instead of stranding the form in side whitespace.
 *   - Form + sidebar are a CSS grid: a single stacked column up to `lg`, then
 *     two columns (fluid form + fixed-ish sidebar) from `lg:` up.
 *   - The Review step spans the full width (single column) — its cards tile
 *     into their own grid and the sidebar is dropped to give them room.
 */

const STEPS = [
  { label: "Step 1", title: "PAN Details"     },
  { label: "Step 2", title: "Email Verify"    },
  { label: "Step 3", title: "Aadhaar"         },
  { label: "Step 4", title: "Selfie"          },
  { label: "Step 5", title: "Bank Account"    },
  { label: "Step 6", title: "Education"       },
  { label: "Step 7", title: "Business"        },
  { label: "Step 8", title: "Review & Submit" },
];

// Per-step success toast copy, keyed by the same key used in saveAndNext.
// Keeps the messages tailored without scattering showAlert calls into each step.
const STEP_SAVED_ALERTS = {
  pan:       { title: "PAN details saved",   message: "Your PAN information was captured." },
  email:     { title: "Email verified",      message: "Your email address is confirmed." },
  aadhaar:   { title: "Aadhaar saved",       message: "Your Aadhaar details were captured." },
  selfie:    { title: "Selfie added",        message: "Your selfie was captured successfully." },
  bank:      { title: "Bank account added",  message: "Your bank details were saved." },
  education: { title: "Education saved",      message: "Your education details were captured." },
  business:  { title: "Business saved",      message: "Your business details were captured." },
};

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // Every step's validated payload, namespaced by step key so colliding fields
  // (PAN and Aadhaar both emit `fullName`) never overwrite each other.
  const [formData, setFormData] = useState({});

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));

  // Forward flow: store this step's data under its key, then advance.
  const saveAndNext = (key) => (data) => {
    setFormData((prev) => ({ ...prev, [key]: data }));
    const saved = STEP_SAVED_ALERTS[key] ?? {
      title: "Step saved",
      message: "Your details were saved.",
    };
    showAlert({ variant: "success", ...saved });
    goNext();
  };

  // Skip an optional step: drop any saved data for it, then advance.
  const skipAndNext = (key) => () => {
    setFormData((prev) => {
      const { [key]: _omit, ...rest } = prev;
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

  const handleSubmit = () => {
    // TODO: send `formData` (including File objects) to the onboarding API.
    console.log("Submitting onboarding application:", formData);
    // The AlertContainer lives above <Routes>, so this success toast survives
    // the navigation and greets the user on the Overview page.
    showAlert({
      variant: "success",
      title: "Application submitted",
      message: "Your onboarding details are in. We'll verify them shortly.",
    });
    // Application submitted — hand the user off to the Overview page.
    navigate("/overview");
  };

  // The Review step goes full-width (its cards tile into a grid), so the
  // illustration sidebar is dropped there to give them room.
  const isReview = currentStep === STEPS.length - 1;

  const stepperSteps = STEPS.map((s, i) => ({
    ...s,
    status: i < currentStep ? "completed" : i === currentStep ? "in_progress" : "pending",
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
    <div className="min-h-screen flex flex-col bg-[#fafafa] font-sans">

      <Topbar />

      <main className="flex-1">
        {/* Content shell — caps at 7xl on most screens, widens on very large ones */}
        <div className="mx-auto w-full max-w-7xl 2xl:max-w-400 box-border px-4 sm:px-6 lg:px-10 xl:px-14 py-4 sm:py-6 lg:py-8">

          {/* Progress stepper */}
          <div className="anim-fade mb-4 lg:mb-5 mx-auto w-full max-w-5xl xl:max-w-6xl">
            <Stepper steps={stepperSteps} activeIndex={currentStep} />
          </div>

          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="anim-fade-d1 inline-flex items-center gap-1.5 text-sm rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5 mb-4"
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
      </main>

      <OnboardingFooter />

    </div>
  );
}
