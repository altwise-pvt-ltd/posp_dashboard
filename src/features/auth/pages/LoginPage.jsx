import { useNavigate } from "react-router-dom";
import { showAlert } from "@/shared/store/alertStore";
import { signIn } from "@/shared/store/authStore";
import { resumeSession } from "@/shared/auth/resumeSession";
import { landingPath } from "@/app/funnel";
import { useMatchMedia, MOBILE_QUERY } from "@/shared/hooks/useMatchMedia";
import logo from "@/assets/let'sInsuranceLogo.svg";
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
 * LoginPage — two screens behind one route.
 *
 * On a tablet or a desktop this is the full landing page: hero, partners,
 * benefits, personas, steps, app promo, testimonials and footer, with the login
 * card sitting in the hero's third column.
 *
 * On a phone it is the login card and nothing else. The marketing page was
 * built to be read at desktop width — below `md` it becomes seven full screens
 * of scrolling in front of the one thing a returning POSP opened the app to do,
 * and the login card is already the bottom of the hero rather than the top. So
 * the sections are dropped rather than restacked.
 *
 * The split is a JS branch, not `md:hidden` on two copies of the tree, for two
 * reasons: the form carries ids (`login-form`, `mobile`, `otp`) that every
 * `htmlFor` and `aria-controls` inside it points at, and rendering it twice
 * would make each of those ambiguous; and a `hidden` section is still a
 * *mounted* section — its effects run, its carousels tick, and the hero
 * illustration (`fetchPriority="high"`, not lazy) is fetched in full on exactly
 * the connection that can least afford it.
 *
 * Either way it's the same `LoginForm` with the same `onVerified`, so the
 * sign-in path below has one implementation.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const isMobile = useMatchMedia(MOBILE_QUERY);

  /* `session` is the `{ token, flow, expiresAt, user, application, overallStatus }`
     the verify call returned. signIn stores it whole — every request after this
     one carries the token, and the onboarding calls quote `application.id`. */
  const handleVerified = async (session) => {
    signIn(session);

    /* The token is in place now, so the call inside this carries it: ask the
       server where this POSP actually stands before deciding where to drop
       them. Which endpoint gets asked depends on `session.flow` — the wizard's
       status for someone still filling it in, the POSP record for someone
       already registered. See `shared/auth/resumeSession.js`.

       Awaited rather than fired off, for two reasons. It sets the funnel flags
       that `landingPath()` reads one line down, so a race here lands a POSP who
       finished on another device back at step 1 of a wizard they've already
       submitted. And on the onboarding path it seeds the wizard's step, so
       awaiting means they arrive *on* the step they left rather than watching
       the screen jump from step 1 to step 5 a moment after it paints.

       The cost is that "Verify" spins for one more round trip — LoginForm
       awaits this handler, so the button stays busy for the whole of it.

       Failure is deliberately not fatal: resumeSession never rejects, and the
       screen the user lands on retries and surfaces the error itself. A sign-in
       that worked shouldn't be undone by a follow-up call that didn't. */
    await resumeSession(session);

    showAlert({
      variant: "success",
      title: "Signed in",
      message: "You're verified — welcome back!",
    });
    // signIn() has already flipped the auth flag, so landingPath() resolves to
    // the next unfinished stage: onboarding, then training, then the dashboard.
    navigate(landingPath(), { replace: true });
  };

  /* ── Phone: the card, centred, and the mark above it ── */
  if (isMobile) {
    return (
      /* The glow band the app-promo section uses, here carrying the whole
         screen: the card is white, and on a flat white page it reads as part of
         the background rather than as a card.

         `min-h-dvh`, not `min-h-screen` — this layout is vertically centred, and
         `vh` on a phone means the viewport with the browser chrome retracted, so
         the card would be pushed below the fold until the user scrolled. */
      <div className="landing-scale flex min-h-dvh flex-col items-center justify-center gap-9 bg-linear-to-br from-white via-orange-50/40 to-orange-100/30 px-4 py-12 font-sans">
        {/* Same 172×40 lockup as the landing header, sized the same way: width
            drives it and height follows the ratio. */}
        <img
          src={logo}
          alt="LetsInsurance"
          width={172}
          height={40}
          className="h-auto w-56"
        />

        <LoginForm onVerified={handleVerified} />
      </div>
    );
  }

  /* ── Tablet and up: the full landing page ── */
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
