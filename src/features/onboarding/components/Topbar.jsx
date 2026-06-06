import logo from "@/assets/logo.png";

/**
 * Topbar — constant header for the onboarding flow.
 * Shows the brand logo. (Breadcrumb now lives below the stepper, in OnboardingScreen.)
 */
export default function Topbar() {
  return (
    <header className="shrink-0 border-b border-orange-100/70 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">

        {/* Brand logo */}
        <img src={logo} alt="POSP" className="h-10 w-auto" />

      </div>
    </header>
  );
}
