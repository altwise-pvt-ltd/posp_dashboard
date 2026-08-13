import { useNavigate } from "react-router-dom";
import { showAlert } from "@/shared/store/alertStore";
import { signIn } from "@/shared/store/authStore";
import { landingPath } from "@/app/funnel";
import LoginForm from "../components/LoginForm";
import Header from "../components/landing/Header";
import HeroSection from "../components/landing/HeroSection";
import PartnersSection from "../components/landing/PartnersSection";
import WhyBecomeSection from "../components/landing/WhyBecomeSection";
import WhoCanBecomeSection from "../components/landing/WhoCanBecomeSection";
import StepsSection from "../components/landing/StepsSection";
import OneAppSection from "../components/landing/OneAppSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import OnboardingFooter from "@/features/onboarding/components/OnboardingFooter";

/**
 * LoginPage — full landing page with hero, partners, benefits, steps,
 * app promo, testimonials, and footer. The LoginForm is embedded in the
 * hero section and still handles OTP sign-in via the onVerified callback.
 */
export default function LoginPage() {
  const navigate = useNavigate();

  const handleVerified = (mobile) => {
    signIn(mobile);
    showAlert({
      variant: "success",
      title: "Signed in",
      message: "You're verified — welcome back!",
    });
    // signIn() has already flipped the auth flag, so landingPath() resolves to
    // the next unfinished stage: onboarding, then training, then the dashboard.
    navigate(landingPath(), { replace: true });
  };

  return (
    /* landing-scale renders this page at 85% of the app's base scale — see the
       variable overrides in index.css. */
    <div className="landing-scale min-h-screen flex flex-col bg-white font-sans">
      <Header />

      <main className="flex-1">
        <HeroSection loginForm={<LoginForm onVerified={handleVerified} />} />
        <PartnersSection />
        <WhyBecomeSection />
        <WhoCanBecomeSection />
        <StepsSection />
        <OneAppSection />
        <TestimonialsSection />
      </main>

      <OnboardingFooter />
    </div>
  );
}
