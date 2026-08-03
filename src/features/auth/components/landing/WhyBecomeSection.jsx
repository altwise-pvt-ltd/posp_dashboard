import benefitPayouts from "@/assets/landing/benefit-payouts.png";
import benefitPaperwork from "@/assets/landing/benefit-paperwork.png";
import benefitTraining from "@/assets/landing/benefit-training.png";
import benefitSupport from "@/assets/landing/benefit-support.png";
import benefitPolicies from "@/assets/landing/benefit-policies.png";
import benefitDashboard from "@/assets/landing/benefit-dashboard.png";

const BENEFITS = [
  {
    icon: benefitPayouts,
    title: "Timely Payouts",
    desc: "Receive your commissions on time, every time, directly in your bank account.",
  },
  {
    icon: benefitPaperwork,
    title: "No Paperwork",
    desc: "Everything is digital. No forms, no hassle. Sell policies from your phone.",
  },
  {
    icon: benefitTraining,
    title: "Professional Training",
    desc: "Get access to comprehensive training modules to help you grow as an advisor.",
  },
  {
    icon: benefitSupport,
    title: "Dedicated Support",
    desc: "Our support team is always ready to help you with any queries or issues.",
  },
  {
    icon: benefitPolicies,
    title: "Instant Policies",
    desc: "Issue policies instantly with a few clicks. No waiting, no delays.",
  },
  {
    icon: benefitDashboard,
    title: "Simple Dashboard Platform",
    desc: "Manage your entire business from a single, easy-to-use dashboard.",
  },
];

function BenefitCard({ icon, title, desc }) {
  return (
    <div className="flex items-stretch rounded-xl bg-gradient-to-br from-white to-orange-50/50 shadow-md border-b-4 border-[#f47c3c] overflow-hidden">
      {/* Icon circle */}
      <div className="flex items-center justify-center px-5 py-6">
        <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-orange-200/60">
          <img src={icon} alt="" className="h-10 w-10 object-contain" />
        </div>
      </div>

      {/* Divider + text */}
      <div className="flex flex-col justify-center border-l border-gray-200 px-5 py-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

export default function WhyBecomeSection() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        {/* Heading */}
        <h2 className="text-center text-3xl lg:text-[40px] lg:leading-[48px] font-bold text-gray-900 mb-12">
          Why Become a{" "}
          <span className="text-[#f47c3c] font-semibold">LetsInsurance</span>{" "}
          POSP Advisor?
        </h2>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <BenefitCard key={b.title} {...b} />
          ))}
        </div>
      </div>
    </section>
  );
}
