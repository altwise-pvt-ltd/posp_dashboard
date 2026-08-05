import { ArrowRightCircle } from "lucide-react";
import stepsIllustration from "@/assets/landing/steps-illustration.png";
import step1Icon from "@/assets/landing/step1-icon.png";
import step2Icon from "@/assets/landing/step2-icon.png";
import step3Icon from "@/assets/landing/step3-icon.png";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Highlight from "./ui/Highlight";
import BrandButton from "./ui/BrandButton";

const STEPS = [
  {
    icon: step1Icon,
    title: "Create Your Account",
    desc: "Sign up with your mobile number and basic details. It takes less than 2 minutes.",
  },
  {
    icon: step2Icon,
    title: "Complete KYC Verification",
    desc: "Upload your PAN, Aadhaar, and other documents for quick verification.",
  },
  {
    icon: step3Icon,
    title: "Finish Online Training",
    desc: "Complete a short IRDAI-mandated training module and start selling instantly.",
  },
];

function StepCard({ num, icon, title, desc }) {
  return (
    <div className="flex items-start gap-5 rounded-xl border border-gray-100 bg-white p-6 shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
        {num}
      </div>

      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50">
        <img src={icon} alt="" loading="lazy" className="h-8 w-8 object-contain" />
      </div>

      <div className="min-w-0">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

export default function StepsSection() {
  return (
    <Section>
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
        {/* ── Left ── */}
        <div>
          <SectionHeading className="mb-4">
            Become a <Highlight>LetsInsurance</Highlight> POSP Advisor in{" "}
            <Highlight>3 Easy Steps</Highlight>
          </SectionHeading>

          <p className="mb-10 max-w-lg text-sm leading-relaxed text-gray-500">
            Our onboarding process is simple, fast, and completely online. You can
            start selling insurance policies within 24 hours of signing up.
          </p>

          <img
            src={stepsIllustration}
            alt="Steps illustration"
            loading="lazy"
            className="mx-auto h-70 w-auto object-contain lg:mx-0"
          />

          {/* Trust bar */}
          <div className="mt-8 rounded-xl bg-white p-5 text-center text-sm font-medium text-gray-600 shadow-brand-soft">
            Trusted by <Highlight>10,000+</Highlight> Advisors &nbsp;|&nbsp; 100%
            Secure Process &nbsp;|&nbsp; Unlimited Earning Potential
          </div>
        </div>

        {/* ── Right: step cards ── */}
        <div className="flex flex-col gap-6">
          {STEPS.map((step, i) => (
            <StepCard key={step.title} num={i + 1} {...step} />
          ))}

          <BrandButton size="lg" className="mt-2 w-full">
            Start Earning Now
            <ArrowRightCircle size={20} />
          </BrandButton>

          <p className="-mt-2 text-center text-xs text-gray-400">
            100% Free &bull; No Investment &bull; Lifetime Support
          </p>
        </div>
      </div>
    </Section>
  );
}
