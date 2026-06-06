import { useState } from "react";
import { ChevronRight, Home } from "lucide-react";
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

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  // Every step's validated payload, namespaced by step key so colliding fields
  // (PAN and Aadhaar both emit `fullName`) never overwrite each other.
  const [formData, setFormData] = useState({});

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));

  // Forward flow: store this step's data under its key, then advance.
  const saveAndNext = (key) => (data) => {
    setFormData((prev) => ({ ...prev, [key]: data }));
    goNext();
  };

  // Inline edit on the Review screen: overwrite one section without navigating.
  const updateSection = (key, data) =>
    setFormData((prev) => ({ ...prev, [key]: data }));

  const handleSubmit = () => {
    // TODO: send `formData` (including File objects) to the onboarding API.
    console.log("Submitting onboarding application:", formData);
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
      case 6: return <BusinessStep onNext={saveAndNext("business")} />;
      case 7: return <ReviewStep data={formData} onUpdateSection={updateSection} onSubmit={handleSubmit} />;
      default: return <StepPlaceholder step={STEPS[currentStep]} onNext={goNext} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] font-sans">
   
      <Topbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto box-border px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

          {/* Progress stepper */}
          <div className="anim-fade mb-6">
            <Stepper steps={stepperSteps} activeIndex={currentStep} />
          </div>

          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="anim-fade-d1 inline-flex items-center gap-1.5 text-sm rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5 mb-7"
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

          {/* Form + Sidebar */}
          <div className="flex flex-row items-start flex-wrap gap-8 lg:gap-14">
            <div className="anim-fade-d2 flex-[1_1_440px] min-w-0 flex justify-center">
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
