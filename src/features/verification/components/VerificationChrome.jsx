import { ChevronLeft, Home } from "lucide-react";
import Breadcrumb from "@/shared/components/Breadcrumb";

/**
 * The route back out of the screen, at two widths.
 *
 * Desktop gets the full trail up the funnel plus the back button. Onboarding is
 * a real route gated only on sign-in, so a waiting user can genuinely return and
 * review what they submitted.
 *
 * A phone gets the same destination as one back link. The trail plus the button
 * wrapped to two rows and took ~100px of the first screen to offer a route
 * nobody takes mid-funnel on a phone.
 */
export default function VerificationChrome({ onBack }) {
  return (
    <>
      <div className="anim-fade mb-3 hidden flex-wrap items-center justify-between gap-3 sm:flex">
        <Breadcrumb
          items={[
            { label: "Home", href: "https://www.letsinsurance.com/", icon: Home },
            { label: "On Boarding", to: "/onboarding" },
            { label: "Verification" },
          ]}
        />

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:border-orange-200 hover:text-orange-600"
        >
          <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
          Back to my details
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="anim-fade -ml-1.5 mb-2 inline-flex items-center gap-1 rounded-lg px-1.5 py-2 text-sm font-semibold text-slate-500 sm:hidden"
      >
        <ChevronLeft size={16} strokeWidth={2.25} aria-hidden="true" />
        Back to my details
      </button>
    </>
  );
}
