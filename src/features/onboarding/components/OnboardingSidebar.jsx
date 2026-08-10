import { ShieldCheck, BadgeCheck, Zap } from "lucide-react";
import onboardingIllustration from "@/assets/onboarding/onboardingSbg.svg";

const TRUST_POINTS = [
  { Icon: ShieldCheck, color: "#de7b3d", title: "256-bit SSL Encryption", desc: "All data is encrypted in transit and at rest." },
  { Icon: BadgeCheck,  color: "#10b981", title: "IRDAI Compliant",        desc: "Follows all regulatory guidelines for POSP onboarding." },
  { Icon: Zap,         color: "#6366f1", title: "Quick Verification",      desc: "Most applications are verified within 24 hours." },
];

// Illustration with three trust cards below it. Hidden on small screens
// (no room there — the form takes the whole width).
export default function OnboardingSidebar() {
  return (
    <div className="anim-fade-d1 hidden lg:flex w-full flex-col items-center gap-5 lg:pt-2">
      <img
        src={onboardingIllustration}
        alt="Onboarding Illustration"
        width={720}
        height={510}
        className="h-auto w-full lg:max-w-165 2xl:max-w-180"
      />

      <div className="flex w-full flex-col gap-2.5 lg:max-w-165 2xl:max-w-180">
        {TRUST_POINTS.map(({ Icon, color, title, desc }) => (
          <div
            key={title}
            className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" color={color} strokeWidth={2} />
            <div>
              <div className="text-[0.8125rem] font-semibold text-slate-700">{title}</div>
              <div className="text-xs text-slate-400">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
