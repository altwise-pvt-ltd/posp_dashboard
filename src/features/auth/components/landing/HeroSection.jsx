import { ShieldCheck, Check, ArrowRightCircle } from "lucide-react";
import heroAgent from "@/assets/landing/agent.png";
import Section from "./ui/Section";
import Highlight from "./ui/Highlight";
import BrandButton from "./ui/BrandButton";

const CHECKLIST = [
  "Unlimited Earnings",
  "50+ Insurance Products",
  "Instant Policy Issuance",
  "Fast & Timely Payouts",
  "Work Anytime, Anywhere",
  "Dedicated Support Always",
];

export default function HeroSection({ loginForm }) {
  return (
    <Section padding="tight">
      {/* items-start, not items-center: the login card changes height when the OTP
          step opens. Centring would re-centre the other two columns against the
          taller row and visibly drag them down, so every column is top-pinned and
          the card grows on its own. */}
      {/* The login track is sized to the card's own max-w-90, not wider: any extra
          width would sit as dead space on the card's left, since the card is
          right-pinned and can't grow into it. */}
      <div className="grid grid-cols-1 items-start gap-x-10 gap-y-0 lg:grid-cols-[1fr_auto_minmax(0,362px)] lg:gap-6">
        {/* ── Left: content ── */}
        {/* Mobile keeps only the headline and the zero-investment line, centred;
            the badge, checklist and CTA are lg-only so the login card stays near
            the fold. */}
        <div className="flex flex-col gap-5 text-center lg:text-left">
          <span className="hidden w-fit items-center gap-2 rounded-full border border-brand/30 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm lg:inline-flex">
            <ShieldCheck size={16} className="text-brand" />
            India's <Highlight>Trusted</Highlight> Insurance Platform
          </span>

          {/* Mobile lets the headline flow and balances the line lengths so the
              centred block reads evenly; lg pins the three fixed lines back. */}
          <h1 className="text-balance text-4xl font-bold leading-[1.15] tracking-tight lg:text-5xl">
            <span className="text-gray-900 lg:block">Become a</span>{" "}
            <Highlight className="lg:block">Letsinsurance</Highlight>{" "}
            <span className="text-gray-900 lg:block">POSP Advisor</span>
          </h1>

          <p className="mx-auto max-w-xs text-balance text-base text-gray-500 lg:mx-0 lg:max-w-none">
            Start your insurance business with{" "}
            <Highlight className="font-semibold">zero investment.</Highlight>
          </p>

          <ul className="hidden grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid">
            {CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-sm text-gray-700"
              >
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-brand">
                  <Check size={11} strokeWidth={3.5} className="text-white" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* Wrapper, not `hidden` on the button itself: BrandButton hardcodes
              inline-flex in its base classes and wins the display conflict. */}
          <div className="mt-2 hidden lg:block">
            <BrandButton className="w-fit">
              Become Advisor Now
              <ArrowRightCircle size={20} />
            </BrandButton>
          </div>
        </div>

        {/* ── Centre: illustration (agent, badges and app screen are one image) ── */}
        <div className="flex justify-center lg:block">
          <img
            src={heroAgent}
            alt="POSP Advisor with the Letsinsurance advisor app"
            className="h-90 w-auto object-contain sm:h-90 lg:h-155"
          />
        </div>

        {/* ── Right: login form ── */}
        {/* The grid's gap-10 is wanted between the headline and the illustration
            but not between the illustration and the card — the agent art already
            carries its own bottom whitespace, so on mobile the row gap is pulled
            back out and only the lg columns keep it. */}
        <div className="flex justify-center lg:mt-0 lg:justify-end">
          {loginForm}
        </div>
      </div>
    </Section>
  );
}
