import { ShieldCheck, BadgeCheck, Zap } from "lucide-react";
import onboardingIllustration from "@/assets/onboarding/onboardingSbg.svg";

const TRUST_POINTS = [
  {
    Icon: ShieldCheck,
    color: "#de7b3d",
    bg: "rgba(222,123,61,0.08)",
    title: "256-bit SSL Encryption",
    desc: "All data is encrypted in transit and at rest.",
  },
  {
    Icon: BadgeCheck,
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    title: "IRDAI Compliant",
    desc: "Follows all regulatory guidelines for POSP onboarding.",
  },
  {
    Icon: Zap,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
    title: "Quick Verification",
    desc: "Most applications are verified within 24 hours.",
  },
];

function TrustBadge({ Icon, color, bg, title, desc }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-slate-100 bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Icon tile — colour + tint are data-driven, so they stay inline */}
      <div
        className="mt-px flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px]"
        style={{ background: bg }}
      >
        <Icon size={17} color={color} strokeWidth={2} />
      </div>
      <div>
        <div className="mb-0.5 text-[13px] font-bold text-slate-800">{title}</div>
        <div className="text-[12px] leading-normal text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

/**
 * OnboardingSidebar — illustration + trust badges shown beside the form.
 *
 * Grows from a 320px basis; wraps below the form on narrow screens (handled by
 * the parent flex container). The illustration is hidden below `md` to keep the
 * form above the fold on phones.
 */
export default function OnboardingSidebar() {
  return (
    <div className="anim-fade-d1 flex flex-[1_1_320px] flex-col items-center justify-start gap-8 pt-2">
      {/* Decorative illustration — hidden on phones to keep the form above the fold */}
      <img
        src={onboardingIllustration}
        alt=""
        className="hidden h-auto w-full max-w-[480px] md:block"
      />

      <div className="flex w-full max-w-[380px] flex-col gap-3">
        {TRUST_POINTS.map((point) => (
          <TrustBadge key={point.title} {...point} />
        ))}
      </div>
    </div>
  );
}
