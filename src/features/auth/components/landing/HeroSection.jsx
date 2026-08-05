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
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_auto_minmax(0,360px)] lg:gap-6">
        {/* ── Left: content ── */}
        <div className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/30 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
            <ShieldCheck size={16} className="text-brand" />
            India's <Highlight>Trusted</Highlight> Insurance Platform
          </span>

          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight lg:text-5xl">
            <span className="block text-gray-900">Become a</span>
            <Highlight className="block">Letsinsurance</Highlight>
            <span className="block text-gray-900">POSP Advisor</span>
          </h1>

          <p className="text-base text-gray-500">
            Start your insurance business with{" "}
            <Highlight className="font-semibold">zero investment.</Highlight>
          </p>

          <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
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

          <BrandButton className="mt-2 w-fit">
            Become Advisor Now
            <ArrowRightCircle size={20} />
          </BrandButton>
        </div>

        {/* ── Centre: illustration (agent, badges and app screen are one image) ── */}
        <div className="hidden lg:block">
          <img
            src={heroAgent}
            alt="POSP Advisor with the Letsinsurance advisor app"
            className="h-135 w-auto object-contain"
          />
        </div>

        {/* ── Right: login form ── */}
        <div className="flex justify-center lg:justify-end">{loginForm}</div>
      </div>
    </Section>
  );
}
