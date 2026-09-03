import { useEffect, useState } from 'react';
import { ensurePospProfile } from '@/shared/store/pospProfileStore';
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

function DashboardLayout({ children }) {
  // Collapsed/expanded state of the *static* rail, which only exists from `lg`
  // up. Below `lg` the rail is an overlay drawer and this is ignored — a 68px
  // icon rail is still a sixth of a 390px phone, so the narrow mode isn't a
  // useful mobile answer; being off-canvas entirely is.
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Scrim — only ever visible below `lg`, where the rail is an overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}

      {/*
        One <aside> in two modes:
          < lg  fixed overlay drawer, slid off-canvas
          ≥ lg  static in-flow rail whose width animates between the two,
                opening out further from `xl`
        The widths below read as 13rem / 5rem / 16rem but render at 85% of that
        — 176px, 68px and 216px — because `.sidebar-scale` rescales the
        --spacing these resolve against for this element and everything inside
        it. See the block in index.css.
        The narrow rail is exactly its nav pill plus the aside's own padding, so
        it has nothing further to give; the drawer is off-canvas rather than
        narrow because even 68px is a sixth of a 390px phone.
        `lg:relative` matters as much as `lg:static` — the collapse toggle below
        is positioned against this element, and a plain `static` ancestor would
        drop it onto the viewport instead.
      */}
      <aside
        className={`sidebar-scale fixed inset-y-0 left-0 z-40 w-52 shrink-0 border-r border-slate-200 bg-white p-4 transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0 lg:transition-[width] ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'xl:w-64'}`}
      >
        {/* Collapse toggle — floats on the right border edge. Desktop only:
            the drawer is dismissed by the scrim, Escape or navigating. */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-8 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-all duration-300 hover:border-orange-200 hover:text-orange-600 active:scale-95 lg:flex"
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

        {/* The narrow icon rail is a desktop affordance; the drawer always
            renders the full labelled nav. */}
        <Sidebar
          collapsed={collapsed && !drawerOpen}
          onNavigate={() => setDrawerOpen(false)}
          onRequestExpand={() => setCollapsed(false)}
        />
      </aside>

      {/* Right column — topbar + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-5 lg:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95 lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="h-full min-w-0 flex-1">
            <Topbar />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className={DASHBOARD_SHELL}>{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
