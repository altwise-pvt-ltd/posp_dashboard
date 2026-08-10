import { useState } from 'react';
import logo from "@/assets/let'sInsuranceLogo.svg";
import { CONTAINER } from '@/features/auth/components/landing/ui/Section';
import UserMenu from './dashboard/UserMenu';

/**
 * BrandTopbar — the landing page's sticky brand bar, minus the marketing nav.
 *
 * Post-login screens that sit outside DashboardLayout (training, the exam
 * handoff) still need the logo and a way back to the account, but none of the
 * public nav: those links go to pages a signed-in learner has already passed
 * through. So the bar keeps the landing header's shell — same height, same
 * container width, same warm shadow — and carries the dashboard's UserMenu as
 * its only control, which is what the overview shows in the same corner.
 *
 * `landing-header` is load-bearing: it exempts the bar from the blanket
 * `header.sticky { height: 4.5rem }` compact-laptop rule in index.css, keeping
 * it at 4.25rem on desktop exactly like the login page.
 */
function BrandTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="landing-header sticky top-0 z-50 bg-white shadow-[0_6px_20px_-8px_rgba(244,124,60,0.45)] lg:shadow-sm">
      <div className={`flex h-18 items-center justify-between lg:h-17 ${CONTAINER}`}>
        {/* The mark is a wide 172×40 lockup, so width drives the size and height
            follows the ratio. These are the pixel sizes the landing bar renders
            at — its w-50 resolves to 160px under landing-scale, which this page
            doesn't run, so the mobile width is written out at face value. */}
        <img
          src={logo}
          alt="LetsInsurance"
          width={172}
          height={40}
          className="h-auto w-40 lg:w-43"
        />

        <UserMenu isOpen={menuOpen} onToggle={() => setMenuOpen((open) => !open)} />
      </div>
    </header>
  );
}

export default BrandTopbar;
