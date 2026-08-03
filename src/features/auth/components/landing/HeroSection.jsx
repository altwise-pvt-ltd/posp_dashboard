import { ShieldCheck, Check, ArrowRightCircle } from "lucide-react";
import heroAgent from "@/assets/landing/hero-agent.png";
import heroMobile from "@/assets/landing/hero-mobile.png";
import heroIcon1 from "@/assets/landing/hero-icon1.png";
import heroIcon2 from "@/assets/landing/hero-icon2.png";
import heroIcon3 from "@/assets/landing/hero-icon3.png";
import heroIcon4 from "@/assets/landing/hero-icon4.png";

const CHECKLIST = [
  "Unlimited Earnings",
  "50+ Insurance Products",
  "Instant Policy Issuance",
  "Fast & Timely Payouts",
  "Work Anytime, Anywhere",
  "Dedicated Support Always",
];

// Floating badges hug the left arc of the dashed circle, top to bottom.
const FLOATING = [
  { src: heroIcon1, className: "top-2 left-16" },
  { src: heroIcon2, className: "top-[28%] left-0" },
  { src: heroIcon3, className: "top-[54%] left-1" },
  { src: heroIcon4, className: "bottom-6 left-12" },
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

          {/* ── Center: illustration ── */}
          <div className="hidden lg:block relative h-[420px] w-[400px]">
            {/* Dashed circle */}
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-[#f47c3c]/25" />

            {/* Agent */}
            <img
              src={heroAgent}
              alt="POSP Advisor"
              className="absolute bottom-0 left-1/2 z-10 h-[400px] w-auto -translate-x-[58%] object-contain"
            />

            {/* Floating icons */}
            {FLOATING.map((icon) => (
              <img
                key={icon.className}
                src={icon.src}
                alt=""
                className={`absolute z-20 h-12 w-12 object-contain ${icon.className}`}
              />
            ))}

            {/* Mobile phone overlay */}
            <img
              src={heroMobile}
              alt="Advisor app dashboard"
              className="absolute bottom-4 right-0 z-20 w-[150px] object-contain drop-shadow-xl"
            />
          </div>

          {/* ── Right: login form ── */}
          <div className="flex justify-center lg:justify-end">{loginForm}</div>
        </div>
      </div>
    </section>
  );
}
