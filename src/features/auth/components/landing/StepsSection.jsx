import { ArrowRightCircle } from "lucide-react";
import stepsIllustration from "@/assets/landing/steps-illustration.png";
import step1Icon from "@/assets/landing/step1-icon.png";
import step2Icon from "@/assets/landing/step2-icon.png";
import step3Icon from "@/assets/landing/step3-icon.png";

const STEPS = [
  {
    num: 1,
    icon: step1Icon,
    title: "Create Your Account",
    desc: "Sign up with your mobile number and basic details. It takes less than 2 minutes.",
  },
  {
    num: 2,
    icon: step2Icon,
    title: "Complete KYC Verification",
    desc: "Upload your PAN, Aadhaar, and other documents for quick verification.",
  },
  {
    num: 3,
    icon: step3Icon,
    title: "Finish Online Training",
    desc: "Complete a short IRDAI-mandated training module and start selling instantly.",
  },
];

export default function StepsSection() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* ── Left ── */}
          <div>
            <h2 className="text-3xl lg:text-[40px] lg:leading-[48px] font-bold text-gray-900 mb-4">
              Become a{" "}
              <span className="text-[#f47c3c] font-semibold">LetsInsurance</span>{" "}
              POSP Advisor in{" "}
              <span className="text-[#f47c3c] font-semibold">3 Easy Steps</span>
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed mb-10 max-w-lg">
              Our onboarding process is simple, fast, and completely online. You can
              start selling insurance policies within 24 hours of signing up.
            </p>

            {/* Illustration */}
            <img
              src={stepsIllustration}
              alt="Steps illustration"
              className="h-[280px] w-auto object-contain mx-auto lg:mx-0"
            />

            {/* Trust bar */}
            <div className="mt-8 rounded-xl bg-white p-5 shadow-[0_4px_24px_rgba(244,124,60,0.10)] text-center text-sm text-gray-600 font-medium">
              Trusted by <span className="text-[#f47c3c]">10,000+</span> Advisors
              &nbsp;|&nbsp; 100% Secure Process &nbsp;|&nbsp; Unlimited Earning
              Potential
            </div>
          </div>

          {/* ── Right: step cards ── */}
          <div className="flex flex-col gap-6">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-5 rounded-xl bg-white p-6 shadow-md border border-gray-100"
              >
                {/* Numbered circle */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f47c3c] text-white text-sm font-bold">
                  {step.num}
                </div>

                {/* Icon */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <img src={step.icon} alt="" className="h-8 w-8 object-contain" />
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}

            {/* CTA */}
            <button
              type="button"
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f47c3c] px-7 py-4 text-base font-semibold text-white shadow-md hover:bg-[#e06a2e] transition-colors"
            >
              Start Earning Now
              <ArrowRightCircle size={20} />
            </button>

            <p className="text-center text-xs text-gray-400 -mt-2">
              100% Free &bull; No Investment &bull; Lifetime Support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
