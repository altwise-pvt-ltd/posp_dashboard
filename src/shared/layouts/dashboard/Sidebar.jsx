import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { isRoutedPath } from '@/app/routes';
import logo from "@/assets/let'sInsuranceLogo.svg";
import iconHome from '@/assets/sidebar/OverviewScreen.webp';
import iconCustomer from '@/assets/sidebar/Customer.webp';
import iconPolicies from '@/assets/sidebar/Policies.webp';
import iconReports from '@/assets/sidebar/Reports.webp';
import renewal from '@/assets/sidebar/renewal.webp';
import Profile from '@/assets/sidebar/profile.webp';
import iconTraining from '@/assets/sidebar/iconTraining.webp';

// `to` is the route path each link navigates to. 'Home', 'Profile' and
// 'POSP Training' map to real pages (/overview, /profile, /posp-training);
// the others have no page yet, so `isRoutedPath` renders them inert — they
// stay visible and styled but clicking them does nothing.
//
// An item with `children` never navigates itself: it toggles its group open.
const NAV_ITEMS = [
  { label: 'Home', to: '/overview', icon: iconHome },
  {
    label: 'Offline Quotation',
    to: '/offline-quotation',
    icon: iconCustomer,
    children: [
      { label: 'Create Quotation', to: '/offline-quotation/create' },
      { label: 'View Quotations', to: '/offline-quotation/view' },
    ],
  },
  { label: 'Policies', to: '/policies', icon: iconPolicies },
  { label: 'Reports', to: '/reports', icon: iconReports },
  { label: 'Renewal', to: '/renewal', icon: renewal },
  { label: 'Profile', to: '/profile', icon: Profile },
  { label: 'POSP Training', to: '/posp-training', icon: iconTraining },
];

const isUnder = (pathname, to) =>
  pathname === to || pathname.startsWith(`${to}/`);

// Every number below is written at the app's base scale and rendered at 85% of
// it: the <aside> in DashboardLayout carries `.sidebar-scale`, which rescales
// the --spacing and --text-* variables these utilities resolve against. So
// `h-12` is the 48px pill this was designed with and the 40.8px one it draws.
// Anything that must shrink with the rail therefore has to be a utility, not an
// arbitrary literal — hence `text-nav-sub` on the submenu labels.
//
// `onNavigate` fires when a real nav item is clicked. DashboardLayout uses it to
// dismiss the mobile drawer, which would otherwise stay parked over the page it
// just opened. It hangs off the click rather than off the route changing so that
// tapping the item you are already on closes the drawer too.
//
// `onRequestExpand` un-collapses the desktop rail. A submenu has nowhere to open
// into on the narrow rail, so a parent tapped there widens it first.
function Sidebar({ collapsed = false, onNavigate, onRequestExpand }) {
  const { pathname } = useLocation();

  // null = untouched, so the group holding the current route decides. A label
  // opens that group, '' closes every group. Kept as state the render derives
  // from rather than an effect that syncs it: landing on a child route with the
  // group shut would otherwise show an active item nested inside a closed parent.
  const [pickedGroup, setPickedGroup] = useState(null);

  const routeGroup =
    NAV_ITEMS.find((item) =>
      item.children?.some((child) => isUnder(pathname, child.to))
    )?.label ?? null;

  // The narrow rail has no room for a submenu, so nothing is open while collapsed.
  const openGroup = collapsed ? null : pickedGroup ?? routeGroup;

  const toggleGroup = (item) => {
    if (collapsed) {
      onRequestExpand?.();
      setPickedGroup(item.label);
      return;
    }
    setPickedGroup(openGroup === item.label ? '' : item.label);
  };

  // Shared between the real NavLink and the inert stand-in so both look identical.
  const linkClass = (isActive) =>
    `relative flex items-center rounded-xl text-sm font-medium transition-all duration-300 group select-none ${collapsed
      ? 'mx-auto h-12 w-12 justify-center'
      : 'gap-3.5 px-4 py-3'
    } ${isActive
      ? 'text-black font-semibold'
      : `text-slate-500 hover:text-slate-900 ${collapsed
        ? 'hover:bg-slate-100/70'
        : 'hover:translate-x-1'
      }`
    }`;

  const linkContent = (item, isActive, trailing = null) => (
    <>
      {/* Sliding Background Pill */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 bg-linear-to-r from-orange-50 to-amber-50/50 border border-orange-100/70 rounded-xl shadow-[0_4px_12px_rgba(249,115,22,0.06)]"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}

      {/* Left Accent Bar — only in expanded mode (looks awkward on the narrow rail) */}
      {isActive && !collapsed && (
        <motion.div
          layoutId="activeLeftBar"
          className="absolute left-0 top-3 bottom-3 w-1 bg-linear-to-b from-orange-500 to-amber-500 rounded-r-full"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}

      {/* Icon */}
      {item.icon && (
        <img
          src={item.icon}
          alt=""
          width={24}
          height={24}
          className={`w-6 h-6 shrink-0 object-contain transition-all duration-300 relative z-10 ${isActive
            ? 'scale-110 filter brightness-110 drop-shadow-[0_2px_4px_rgba(249,115,22,0.15)]'
            : 'group-hover:scale-105 opacity-85 group-hover:opacity-100'
            }`}
        />
      )}

      {/* Label — hidden when collapsed. `truncate` is the safety net for
          'Offline Quotation', which is wider than the rail's text column. */}
      {!collapsed && (
        <span className="relative z-10 min-w-0 flex-1 truncate transition-colors duration-300">
          {item.label}
        </span>
      )}

      {trailing}
    </>
  );

  const childClass = (isActive) =>
    `block rounded-lg px-3 py-2 text-nav-sub transition-colors duration-200 ${isActive
      ? 'bg-orange-50 font-semibold text-orange-600'
      : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Brand Logo Container */}
      <div
        className={`flex items-center pb-6 pt-3 select-none ${collapsed ? 'justify-center px-0' : 'px-3'
          }`}
      >
        {collapsed ? (
          // Compact brand mark — a centered square badge so the wide
          // wordmark never gets squished into the narrow rail.
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 text-base font-bold text-white shadow-[0_4px_12px_rgba(249,115,22,0.25)] transition-all duration-300 hover:scale-105 active:scale-95">
            L
          </div>
        ) : (
          // The wordmark is a 172×40 lockup, drawn here at 146×34 under
          // .sidebar-scale — still wider than the 129px this container has
          // inside the rail. max-w-full lets object-contain scale it down to
          // fit rather than clipping it; at the wider rail from `xl` up it
          // renders at its natural size.
          <img
            src={logo}
            alt="LetsInsure"
            width={172}
            height={40}
            className="h-10 w-auto max-w-full object-contain transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] drop-shadow-sm"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2">
        <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              const isOpen = openGroup === item.label;
              const hasActiveChild = item.children.some((child) =>
                isUnder(pathname, child.to)
              );

              return (
                <li key={item.label} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleGroup(item)}
                    title={collapsed ? item.label : undefined}
                    aria-expanded={isOpen}
                    className={`${linkClass(hasActiveChild)} w-full cursor-pointer text-left`}
                  >
                    {linkContent(
                      item,
                      hasActiveChild,
                      !collapsed && (
                        <ChevronDown
                          aria-hidden="true"
                          className={`relative z-10 h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''
                            }`}
                        />
                      )
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="ml-7 list-none overflow-hidden border-l border-slate-200 p-0 pl-2"
                      >
                        <li className="pt-1.5" aria-hidden="true" />
                        {item.children.map((child) => {
                          const isActive = isUnder(pathname, child.to);
                          return (
                            <li key={child.label} className="pb-0.5">
                              {isRoutedPath(child.to) ? (
                                <NavLink
                                  to={child.to}
                                  onClick={onNavigate}
                                  className={childClass(isActive)}
                                >
                                  {child.label}
                                </NavLink>
                              ) : (
                                <div
                                  aria-disabled="true"
                                  className={`${childClass(false)} cursor-default`}
                                >
                                  {child.label}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            }

            return (
              <li key={item.label} className="relative">
                {isRoutedPath(item.to) ? (
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => linkClass(isActive)}
                  >
                    {({ isActive }) => linkContent(item, isActive)}
                  </NavLink>
                ) : (
                  // No page for this path yet — same look, but it never navigates
                  // and can never be the active item.
                  <div
                    aria-disabled="true"
                    title={collapsed ? item.label : undefined}
                    className={`${linkClass(false)} cursor-default`}
                  >
                    {linkContent(item, false)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
