import { CheckCircle } from "lucide-react";
import appMockup from "@/assets/landing/app-mockup.png";
import googlePlay from "@/assets/landing/google-play.png";
import appStore from "@/assets/landing/app-store.png";

const FEATURES = [
  "Instant policy issuance",
  "Dedicated customer management",
  "Real-time commission tracking",
];

export default function OneAppSection() {
  return (
    <section className="bg-gradient-to-br from-white via-orange-50/40 to-orange-100/30 py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* ── Left ── */}
          <div>
            <h2 className="text-3xl lg:text-[40px] lg:leading-[48px] font-bold text-gray-900 mb-3">
              One App. Complete Insurance{" "}
              <span className="text-[#f47c3c]">Business.</span>
            </h2>

            <p className="text-2xl font-medium text-gray-800 mb-4">
              Compare &middot; Sell &middot; Renew &middot; Earn
            </p>

            <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-lg">
              Everything you need to run your insurance business is in one app.
              Compare plans from 50+ insurers, issue policies instantly, manage
              renewals, and track your earnings — all from your smartphone.
            </p>

            {/* Feature checklist */}
            <ul className="flex flex-col gap-3 mb-8">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircle size={18} className="text-[#f47c3c] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Store badges */}
            <div className="flex items-center gap-4">
              <img
                src={googlePlay}
                alt="Get it on Google Play"
                className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
              <img
                src={appStore}
                alt="Download on the App Store"
                className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </div>
          </div>

          {/* ── Right: mockup ── */}
          <div className="flex justify-center">
            <img
              src={appMockup}
              alt="LetsInsurance app"
              className="h-[400px] lg:h-[480px] w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
