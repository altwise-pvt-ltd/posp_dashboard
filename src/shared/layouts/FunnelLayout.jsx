import Topbar from '@/features/onboarding/components/Topbar';
import OnboardingFooter from '@/features/onboarding/components/OnboardingFooter';
import BrandTopbar from './BrandTopbar';

/**
 * Horizontal shell every funnel page's content sits in — same max-width and
 * side padding, so the header logo and the content below it line up on the same
 * left/right edges at every breakpoint.
 *
 * Exported as a class string rather than baked into the layout because vertical
 * padding differs per page (the wizard needs more room than the verification
 * card), and one page — training — doesn't use a shell at all. Same pattern as
 * `CONTAINER` in the landing page's Section.
 */
export const FUNNEL_SHELL =
  'mx-auto box-border w-full max-w-7xl px-4 sm:px-6 lg:px-10 xl:px-14 2xl:max-w-400';

/**
 * The chrome for every page between login and the dashboard: onboarding, the
 * verification wait, and training.
 *
 * The dashboard has had `DashboardLayout` for this all along; the funnel pages
 * each imported the header and footer by hand and repeated the same flex
 * column, which is four places to touch to change the funnel's chrome. This is
 * the counterpart for the other half of the app.
 *
 * The login page deliberately doesn't use it — it's the public landing page
 * with its own marketing header, and shares only the footer.
 *
 *   header — 'auto'  the onboarding bar: logo only, hides on scroll down
 *            'brand' the post-login bar: logo plus the account menu
 *            'none'  no bar at all, for full-bleed views like the exam
 *   footer — false drops the site footer, for those same full-bleed views
 *
 * `header` and `footer` are separate props rather than one `chrome` flag
 * because training hides both together while other states may not.
 */
export default function FunnelLayout({
  header = 'brand',
  footer = true,
  className = 'bg-[#fafafa] font-sans',
  mainClassName = 'flex-1',
  children,
}) {
  return (
    <div className={`flex min-h-screen flex-col ${className}`}>
      {header === 'auto' && <Topbar />}
      {header === 'brand' && <BrandTopbar />}

      <main className={mainClassName}>{children}</main>

      {footer && <OnboardingFooter />}
    </div>
  );
}
