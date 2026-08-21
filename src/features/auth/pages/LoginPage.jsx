import { useNavigate } from "react-router-dom";
import { showAlert } from "@/shared/store/alertStore";
import { signIn } from "@/shared/store/authStore";
import { refreshOnboardingStatus } from "@/shared/store/onboardingStatusStore";
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

  /* `session` is the `{ token, expiresAt, user, application }` the verify call
     returned. signIn stores it whole — every request after this one carries the
     token, and the onboarding calls quote `application.id`. */
  const handleVerified = async (session) => {
    signIn(session);

    /* The token is in place now, so this call carries it: ask the server where
       this application actually stands before deciding where to drop the user.

       Awaited rather than fired off, for two reasons. It flips the
       `onboardingComplete` flag that `landingPath()` reads one line down, so a
       race here lands a POSP who finished on another device back at step 1 of a
       wizard they've already submitted. And it seeds the wizard's step, so
       awaiting it means they arrive *on* the step they left rather than
       watching the screen jump from step 1 to step 5 a moment after it paints.

       The cost is that "Verify" spins for one more round trip — LoginForm
       awaits this handler, so the button stays busy for the whole of it.

       Failure is deliberately not fatal: refresh() resolves to null rather than
       throwing, and the wizard's own mount retries and surfaces the error. A
       sign-in that worked shouldn't be undone by a status call that didn't. */
    await refreshOnboardingStatus();

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
