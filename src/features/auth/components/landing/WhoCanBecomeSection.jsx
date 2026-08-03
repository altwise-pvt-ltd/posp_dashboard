import { ArrowRightCircle } from "lucide-react";
import whoPospAdvisor from "@/assets/landing/who-posp-advisor.png";
import whoBusiness from "@/assets/landing/who-business.png";
import whoStudent from "@/assets/landing/who-student.png";
import whoRetired from "@/assets/landing/who-retired.png";
import whoHomemaker from "@/assets/landing/who-homemaker.png";
import whoProfessional from "@/assets/landing/who-professional.png";

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

function PersonaCard({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-white to-orange-50/50 shadow-md border-b-4 border-[#f47c3c] p-5">
      {/* Icon circle */}
      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-orange-200/60">
        <img src={icon} alt="" className="h-9 w-9 object-contain" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>

      {/* Arrow */}
      <ArrowRightCircle size={22} className="text-[#f47c3c] shrink-0" />
    </div>
  );
}

export default function WhoCanBecomeSection() {
  return (
    <section className="bg-[#fff4ef] py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* ── Left ── */}
          <div>
            <h2 className="text-3xl lg:text-[40px] lg:leading-[48px] font-bold text-gray-900 mb-3">
              Who Can Become a{" "}
              <span className="text-[#f47c3c] font-semibold">LetsInsurance</span>{" "}
              POSP Advisor?
            </h2>
            <span className="block h-1 w-16 rounded-full bg-[#f47c3c] mb-6" />

            <p className="text-sm text-gray-500 leading-relaxed mb-10 max-w-lg">
              Anyone above 18 years of age with a minimum 10th pass qualification
              can become a POSP advisor. No prior experience in insurance is
              required — we provide everything you need to succeed.
            </p>

            {/* Illustration */}
            <div className="relative flex justify-center">
              <div className="absolute inset-0 m-auto h-[240px] w-[240px] rounded-full border-2 border-dashed border-[#f47c3c]/30" />
              <img
                src={whoPospAdvisor}
                alt="POSP Advisor illustration"
                className="relative z-10 h-[260px] w-auto object-contain"
              />
            </div>
          </div>

          {/* ── Right: persona cards ── */}
          <div className="flex flex-col gap-4">
            {PERSONAS.map((p) => (
              <PersonaCard key={p.title} {...p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
