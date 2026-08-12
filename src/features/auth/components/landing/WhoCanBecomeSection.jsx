import whoPospAdvisor from "@/assets/landing/who-posp-advisor.webp";
import whoBusiness from "@/assets/landing/who-business.webp";
import whoStudent from "@/assets/landing/who-student.webp";
import whoRetired from "@/assets/landing/who-retired.webp";
import whoHomemaker from "@/assets/landing/who-homemaker.webp";
import whoProfessional from "@/assets/landing/who-professional.webp";
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
    /* Off-white band, not the brand tint: the persona cards are flat white now,
       so the band has to be the darker of the two for them to read as cards at
       all. Sits between two white sections, so it still separates cleanly. */
    <Section tone="muted">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* ── Left ── */}
        <div>
          <SectionHeading className="mb-3">
            Who Can Become a <Highlight>LetsInsurance</Highlight> POSP Advisor?
          </SectionHeading>
          <span className="mb-6 block h-1 w-16 rounded-none bg-brand" />

          <p className="mb-10 max-w-lg text-sm leading-relaxed text-gray-500">
            Anyone above 18 years of age with a minimum 10th pass qualification can
            become a POSP advisor. No prior experience in insurance is required — we
            provide everything you need to succeed.
          </p>

          {/* Illustration, haloed by a dashed ring sized to sit just outside it */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 m-auto h-70 w-70 rounded-full border-2 border-dashed border-brand/30" />
            <img
              src={whoPospAdvisor}
              alt="POSP Advisor illustration"
              loading="lazy"
              width={676}
              height={647}
              className="relative z-10 h-100 w-auto object-contain"
            />
          </div>
        </div>

        {/* ── Right: persona cards ──
            Arranged in a grid of tiles on all screen sizes: 2 columns on mobile,
            3 columns on tablet/medium, and 2 columns on desktop beside the
            illustration. The tiles size to their copy and stretch to their row,
            so a row is as tall as its longest description and no taller.

            Five personas over two columns (on mobile and desktop) leaves one over. 
            To keep it visually balanced, the last card spans both columns but is 
            sized and centered to match the exact width of a single column.
            
            - Mobile gap is 0.75rem (gap-3), so half is 0.375rem.
            - Desktop gap is 1rem (gap-4), so half is 0.5rem. */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2 lg:gap-4">
          {PERSONAS.map((persona) => (
            <FeatureCard
              key={persona.title}
              {...persona}
              variant="square"
              className="last:col-span-2 last:mx-auto last:w-[calc(50%-0.375rem)] md:last:col-span-1 md:last:mx-0 md:last:w-auto lg:last:col-span-2 lg:last:mx-auto lg:last:w-[calc(50%-0.5rem)]"
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
