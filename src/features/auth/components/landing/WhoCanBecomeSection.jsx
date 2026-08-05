import whoPospAdvisor from "@/assets/landing/who-posp-advisor.png";
import whoBusiness from "@/assets/landing/who-business.png";
import whoStudent from "@/assets/landing/who-student.png";
import whoRetired from "@/assets/landing/who-retired.png";
import whoHomemaker from "@/assets/landing/who-homemaker.png";
import whoProfessional from "@/assets/landing/who-professional.png";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Highlight from "./ui/Highlight";
import FeatureCard from "./ui/FeatureCard";

const PERSONAS = [
  {
    icon: whoBusiness,
    title: "Business Owners",
    desc: "Add insurance to your business offerings and earn extra income.",
  },
  {
    icon: whoStudent,
    title: "College Students",
    desc: "Start earning while you study. Flexible hours, great learning experience.",
  },
  {
    icon: whoRetired,
    title: "Retired Individuals",
    desc: "Stay active and earn a steady income after retirement.",
  },
  {
    icon: whoHomemaker,
    title: "Homemakers",
    desc: "Work from home, manage your time, and build a career in insurance.",
  },
  {
    icon: whoProfessional,
    title: "Working Professionals",
    desc: "Earn additional income alongside your current job.",
  },
];

export default function WhoCanBecomeSection() {
  return (
    <Section tone="tint">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* ── Left ── */}
        <div>
          <SectionHeading className="mb-3">
            Who Can Become a <Highlight>LetsInsurance</Highlight> POSP Advisor?
          </SectionHeading>
          <span className="mb-6 block h-1 w-16 rounded-full bg-brand" />

          <p className="mb-10 max-w-lg text-sm leading-relaxed text-gray-500">
            Anyone above 18 years of age with a minimum 10th pass qualification can
            become a POSP advisor. No prior experience in insurance is required — we
            provide everything you need to succeed.
          </p>

          {/* Illustration, haloed by a dashed ring sized to sit just outside it */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 m-auto h-90 w-90 rounded-full border-2 border-dashed border-brand/30" />
            <img
              src={whoPospAdvisor}
              alt="POSP Advisor illustration"
              loading="lazy"
              className="relative z-10 h-120 w-auto object-contain"
            />
          </div>
        </div>

        {/* ── Right: persona cards ── */}
        <div className="flex flex-col gap-4">
          {PERSONAS.map((persona) => (
            <FeatureCard key={persona.title} {...persona} />
          ))}
        </div>
      </div>
    </Section>
  );
}
