import { CheckCircle } from "lucide-react";
import appMockup from "@/assets/landing/app-mockup.png";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Highlight from "./ui/Highlight";
import StoreBadges from "./ui/StoreBadges";

const FEATURES = [
  "Instant policy issuance",
  "Dedicated customer management",
  "Real-time commission tracking",
];

export default function OneAppSection() {
  return (
    <Section tone="glow">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* ── Left ── */}
        <div>
          <SectionHeading className="mb-3">
            One App. Complete Insurance <Highlight>Business.</Highlight>
          </SectionHeading>

          <p className="mb-4 text-2xl font-medium text-gray-800">
            Compare &middot; Sell &middot; Renew &middot; Earn
          </p>

          <p className="mb-8 max-w-lg text-sm leading-relaxed text-gray-500">
            Everything you need to run your insurance business is in one app.
            Compare plans from 50+ insurers, issue policies instantly, manage
            renewals, and track your earnings — all from your smartphone.
          </p>

          <ul className="mb-8 flex flex-col gap-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-700">
                <CheckCircle size={18} className="shrink-0 text-brand" />
                {feature}
              </li>
            ))}
          </ul>

          <StoreBadges />
        </div>

        {/* ── Right: mockup ── */}
        <div className="flex justify-center">
          <img
            src={appMockup}
            alt="LetsInsurance app"
            loading="lazy"
            className="h-100 w-auto object-contain lg:h-120"
          />
        </div>
      </div>
    </Section>
  );
}
