const FOOTER_LINKS = ["Q&A", "Support", "Terms", "Privacy"];

/**
 * OnboardingFooter — constant informational strip at the bottom of every onboarding page.
 *
 * Responsive: stacked + centred on phones, single row with space-between from `sm` up.
 */
export default function OnboardingFooter() {
  return (
    <footer className="border-t border-primary/8 bg-slate-800 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-4.5 text-center sm:flex-row sm:justify-between sm:gap-2 sm:px-6 sm:text-left lg:px-10">
        <span className="text-[0.8125rem] text-slate-50">
          © 2026 POSP. All rights reserved.
        </span>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-[0.8125rem] text-slate-50 transition-colors duration-150 hover:text-primary"
            >
              {link}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
