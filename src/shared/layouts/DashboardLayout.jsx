import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, ChevronLeft, FileText, House, Menu, User } from 'lucide-react';
import { ensurePospProfile } from '@/shared/store/pospProfileStore';
import BottomNavBar from '@/shared/components/BottomNavBar';
import NavSheet from './dashboard/NavSheet';
import { MORE_ITEMS, QUOTE_ITEMS } from './dashboard/sheetItems';
import Sidebar from './dashboard/Sidebar';
import Topbar from './dashboard/Topbar';

/**
 * Horizontal shell every dashboard page's content sits in — the counterpart to
 * `FUNNEL_SHELL` in FunnelLayout, and the reason these pages no longer run
 * edge-to-edge on a wide monitor.
 *
 * The padding ramp is deliberately shallower than the funnel's
 * (`px-4 sm:px-6 lg:px-10 xl:px-14`): from `lg` up this page already spends
 * 176px — 216px from `xl` — on the sidebar, so repeating the funnel's inset
 * would inset the content twice.
 *
 * The cap is written on the spacing scale (`max-w-320` = 320 × 0.25rem = 1280px,
 * `2xl:max-w-400` = 1600px, matching FUNNEL_SHELL's own `2xl:max-w-400`) rather
 * than as `max-w-7xl`. `max-w-7xl` resolves to the same 1280px but would be
 * caught by the `main .max-w-7xl { padding: … !important }` block in index.css,
 * which was written for the funnel's short-viewport mode and would silently
 * flatten this padding on a 768px-tall laptop.
 */
export const DASHBOARD_SHELL =
  'mx-auto box-border w-full max-w-320 2xl:max-w-400 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6';

/**
 * The phone bar's tabs — deliberately NOT the sidebar's `NAV_ITEMS`.
 *
 * Two reasons they are a separate list rather than a slice of that one. Seven
 * items across a 390px phone leaves each tab 55px wide, under the 44px target
 * once a label is under the icon; and every tab here resolves to a page that
 * actually exists, because a tab that visibly does nothing when tapped reads as
 * broken on touch in a way an inert sidebar row does not. The sidebar's unbuilt
 * paths (/policies, /reports, /renewal) therefore stay out until they are real.
 *
 * `QUOTE` and `MORE` open a bottom sheet (NavSheet) instead of navigating:
 * Quote offers create or view, More lists the modules that have no tab here.
 * POSP Training is in neither, on purpose — it is not reached from a phone.
 *
 * Icons are lucide components, not the sidebar's .webp assets: the bar sizes
 * and re-weights its icon per state (`size`, `strokeWidth`), which an <img>
 * cannot answer.
 */
const QUOTE = 'quote';
const MORE = 'more';
const HOME = '/overview';

const BOTTOM_NAV_ITEMS = [
  { id: HOME, label: 'Home', icon: House },
  { id: QUOTE, label: 'Quote', icon: FileText },
  { id: '/business', label: 'My Business', icon: Briefcase },
  { id: '/profile', label: 'Profile', icon: User },
  { id: MORE, label: 'More', icon: Menu },
];

// Which tab a given URL lights up. Prefix-matched, so /offline-quotation/create/3
// keeps Quote lit.
//
// /posp-training and /certificate are absent on purpose. They used to map to
// the My Business tab, back when that tab navigated to training; now that it
// opens /business, keeping them here would light a tab for a page it does not
// lead to — press it and you'd leave the page that highlighted it. Those two
// screens are reached through More, so every tab dark is the honest answer:
// none of them is where you are.
const TAB_PREFIXES = [
  ['/overview', '/overview'],
  ['/offline-quotation', QUOTE],
  ['/business', '/business'],
  ['/profile', '/profile'],
];

const isUnder = (pathname, prefix) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

// Pages reached through the More sheet light the More tab.
const activeTabFor = (pathname) => {
  if (MORE_ITEMS.some((item) => isUnder(pathname, item.to))) return MORE;
  return TAB_PREFIXES.find(([prefix]) => isUnder(pathname, prefix))?.[1] ?? null;
};

function DashboardLayout({ children }) {
  // Collapsed/expanded state of the rail, which only exists from `lg` up.
  // Below `lg` there is no sidebar at all — the bottom bar is the navigation.
  const [collapsed, setCollapsed] = useState(false);
  // Which bottom sheet is open: QUOTE, MORE or null.
  const [sheet, setSheet] = useState(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  const { pathname, key } = useLocation();
  const navigate = useNavigate();

  // A page opened directly has no history to go back through, so it goes home.
  const goBack = () => {
    if (key === 'default') navigate(HOME, { replace: true });
    else navigate(-1);
  };

  /**
   * The POSP record, for the bar above every dashboard page.
   *
   * `UserMenu` reads the profile but deliberately never fetches it — it also
   * renders inside `BrandTopbar` on the onboarding side of the funnel, where
   * there is no POSP row to ask for. So the fetch belongs to the layout that is
   * only ever mounted after registration, which is this one. Without it the
   * dashboard's own bar had no name and no photograph to draw: the store was
   * only ever filled by /profile and /verification, so landing on the dashboard
   * first showed the mobile number and a plain initial.
   *
   * `ensureLoaded`, not `refresh` — the sign-in path has usually fetched it
   * already, and this resolves instantly when it has.
   */
  useEffect(() => {
    ensurePospProfile();
  }, []);

  // Fetch the More sheet's illustrations up front so they are ready when it opens.
  useEffect(() => {
    MORE_ITEMS.forEach((item) => {
      if (item.image) new Image().src = item.image;
    });
  }, []);

  return (
    <div className="h-dvh flex bg-slate-50 overflow-hidden">
      {/*
        The rail, from `lg` up only: a static in-flow column whose width
        animates between collapsed and expanded, opening out further from `xl`.
        The widths below read as 13rem / 5rem / 16rem but render at 85% of that
        — 176px, 68px and 216px — because `.sidebar-scale` rescales the
        --spacing these resolve against for this element and everything inside
        it. See the block in index.css.
        `relative` matters — the collapse toggle below is positioned against
        this element.
      */}
      <aside
        className={`sidebar-scale relative hidden shrink-0 border-r border-slate-200 bg-white p-4 transition-[width] duration-300 ease-in-out lg:block ${
          collapsed ? 'w-20' : 'w-52 xl:w-64'
        }`}
      >
        {/* Collapse toggle — floats on the right border edge. */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-8 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-all duration-300 hover:border-orange-200 hover:text-orange-600 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3.5 w-3.5 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <Sidebar collapsed={collapsed} onRequestExpand={() => setCollapsed(false)} />
      </aside>

      {/* Right column — topbar + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative z-10 h-16 shrink-0 shadow-[0_2px_8px_rgba(15,23,42,0.06)] lg:shadow-none flex items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-5 lg:px-6">
          {pathname !== HOME && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="-ml-2 -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95 lg:hidden"
            >
              <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
            </button>
          )}

          <div className="h-full min-w-0 flex-1">
            <Topbar />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className={DASHBOARD_SHELL}>{children}</div>
        </main>

        {/*
          In-flow and `shrink-0`, not `fixed`. The shell above is `h-dvh
          flex overflow-hidden` and the scroll lives inside <main>, so a sibling
          here just makes that scroll area shorter: no page needs bottom padding
          to clear the bar, DASHBOARD_SHELL needs no mobile-only override, and
          the bar cannot drift while iOS animates its URL bar.

          `lg:hidden` is the same breakpoint the rail appears at — from `lg` up
          the rail is the navigation.
        */}
        <BottomNavBar
          className="relative z-20 shrink-0 shadow-[0_-2px_8px_rgba(15,23,42,0.06)] lg:hidden"
          items={BOTTOM_NAV_ITEMS}
          activeId={sheet ?? activeTabFor(pathname)}
          onChange={(id) => {
            if (id === QUOTE || id === MORE) {
              setSheet(id);
              return;
            }
            navigate(id);
          }}
        />
      </div>

      <NavSheet
        open={sheet === QUOTE}
        title="Quotation"
        items={QUOTE_ITEMS}
        list
        onClose={closeSheet}
      />
      <NavSheet open={sheet === MORE} title="More" items={MORE_ITEMS} onClose={closeSheet} />
    </div>
  );
}

export default DashboardLayout;
