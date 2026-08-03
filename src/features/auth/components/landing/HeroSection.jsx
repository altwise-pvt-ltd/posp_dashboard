import { ShieldCheck, Check, ArrowRightCircle } from "lucide-react";
import heroAgent from "@/assets/landing/agent.png";

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
    <section className="bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_minmax(0,400px)] gap-10 lg:gap-8 items-center">
          {/* ── Left: content ── */}
          <div className="flex flex-col gap-5">
            {/* Tag pill */}
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f47c3c]/30 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
              <ShieldCheck size={16} className="text-[#f47c3c]" />
              India's <span className="text-[#f47c3c]">Trusted</span> Insurance
              Platform
            </span>

            {/* Heading */}
            <h1 className="text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight">
              <span className="block text-gray-900">Become a</span>
              <span className="block text-[#f47c3c]">Letsinsurance</span>
              <span className="block text-gray-900">POSP Advisor</span>
            </h1>

            {/* Subtext */}
            <p className="text-base text-gray-500">
              Start your insurance business with{" "}
              <span className="text-[#f47c3c] font-semibold">
                zero investment.
              </span>
            </p>

            {/* Checklist */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {CHECKLIST.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-gray-700"
                >
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#f47c3c]">
                    <Check size={11} strokeWidth={3.5} className="text-white" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              type="button"
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-[#f47c3c] px-7 py-3.5 text-base font-semibold text-white shadow-md hover:bg-[#e06a2e] transition-colors"
            >
              Become Advisor Now
              <ArrowRightCircle size={20} />
            </button>
          </div>

          {/* ── Center: illustration (agent, badges and app screen are one image) ── */}
          <div className="hidden lg:block">
            <img
              src={heroAgent}
              alt="POSP Advisor with the Letsinsurance advisor app"
              className="h-[420px] w-auto object-contain"
            />
          </div>

          {/* ── Right: login form ── */}
          <div className="flex justify-center lg:justify-end">{loginForm}</div>
        </div>
      </div>
    </section>
  );
}
