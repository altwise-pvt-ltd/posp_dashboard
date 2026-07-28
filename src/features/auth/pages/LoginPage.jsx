import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { showAlert } from "@/shared/store/alertStore";
import { signIn } from "@/shared/store/authStore";
import { isOnboardingComplete } from "@/shared/store/onboardingStore";
import OnboardingFooter from "@/features/onboarding/components/OnboardingFooter";
import LoginForm from "../components/LoginForm";

/**
 * LoginPage — the app's front door. A centered sign-in card on a soft warm
 * background, reusing the brand logo and the locked-in login theme.
 *
 * On a verified OTP we flip the auth flag, then hand the user off down the
 * funnel: anyone who hasn't finished onboarding goes to the wizard, everyone
 * else lands on the dashboard. The `/` redirect uses the same rule.
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
    navigate(isOnboardingComplete() ? "/overview" : "/onboarding", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-orange-50/50 via-[#fafafa] to-[#fafafa] font-sans">

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Brand */}
        <div className="anim-fade mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="POSP" className="h-11 w-auto mb-3" />
          <p className="text-sm text-slate-500 max-w-xs">
            Welcome to your POSP partner portal
          </p>
        </div>

        <div className="anim-fade-d1 w-full flex justify-center">
          <LoginForm onVerified={handleVerified} />
        </div>

      </main>

      <OnboardingFooter />

    </div>
  );
}
