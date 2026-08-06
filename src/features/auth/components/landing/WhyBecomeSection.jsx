import benefitPayouts from "@/assets/landing/benefit-payouts.png";
import benefitPaperwork from "@/assets/landing/benefit-paperwork.png";
import benefitTraining from "@/assets/landing/benefit-training.png";
import benefitSupport from "@/assets/landing/benefit-support.png";
import benefitPolicies from "@/assets/landing/benefit-policies.png";
import benefitDashboard from "@/assets/landing/benefit-dashboard.png";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Highlight from "./ui/Highlight";
import FeatureCard from "./ui/FeatureCard";

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

export default function WhyBecomeSection() {
  return (
    <Section>
      <SectionHeading center className="mb-12">
        Why Become a <Highlight>LetsInsurance</Highlight> POSP Advisor?
      </SectionHeading>

      <div className="grid grid-cols-3 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <FeatureCard key={benefit.title} {...benefit} variant="divided" />
        ))}
      </div>
    </Section>
  );
}
