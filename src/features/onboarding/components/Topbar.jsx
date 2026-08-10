import logo from "@/assets/let'sInsuranceLogo.svg";

/**
 * Topbar — constant header for the onboarding flow.
 * Shows the brand logo. (Breadcrumb now lives below the stepper, in OnboardingScreen.)
 */
export default function Topbar() {
  return (
    <header className="shrink-0 border-b border-orange-100/70 bg-white/80 backdrop-blur sticky top-0 z-30">
      {/*
        max-w-7xl  -> caps at 1280px on most screens
        2xl:max-w-[96rem] -> allows growth to 1536px on very large monitors
        Keep this max-w value IDENTICAL across Topbar, Stepper, and OnboardingScreen
        so the header, steps, and content all line up at the same left/right edges.
      */}
      <div className="flex h-16 items-center justify-start px-4 sm:px-6 lg:px-10 2xl:px-12 max-w-7xl 2xl:max-w-384 mx-auto">

        {/* Brand logo */}
        <img src={logo} alt="POSP" width={172} height={40} className="h-10 w-auto" />

      </div>
    </header>
  );
}