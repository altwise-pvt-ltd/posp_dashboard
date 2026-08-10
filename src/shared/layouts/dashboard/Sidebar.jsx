import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isRoutedPath } from '@/app/routes';
import logo from "@/assets/let'sInsuranceLogo.svg";
import iconHome from '@/assets/sidebar/OverviewScreen.png';
import iconCustomers from '@/assets/sidebar/Customer.png';
import iconPolicies from '@/assets/sidebar/Policies.png';
import iconReports from '@/assets/sidebar/Reports.png';
import renewal from '@/assets/sidebar/renewal.png';
import Profile from '@/assets/sidebar/profile.png';
import iconTraining from '@/assets/sidebar/iconTraining.png';

// `to` is the route path each link navigates to. 'Home', 'Profile' and
// 'POSP Training' map to real pages (/overview, /profile, /posp-training);
// the others have no page yet, so `isRoutedPath` renders them inert — they
// stay visible and styled but clicking them does nothing.
const NAV_ITEMS = [
  { label: 'Home', to: '/overview', icon: iconHome },
  { label: 'Customers', to: '/customers', icon: iconCustomers },
  { label: 'Policies', to: '/policies', icon: iconPolicies },
  { label: 'Reports', to: '/reports', icon: iconReports },
  { label: 'Renewal', to: '/renewal', icon: renewal },
  { label: 'Profile', to: '/profile', icon: Profile },
  { label: 'POSP Training', to: '/posp-training', icon: iconTraining },
];

function Sidebar({ collapsed = false }) {
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

  const linkContent = (item, isActive) => (
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

      {/* Label — hidden when collapsed */}
      {!collapsed && (
        <span className="relative z-10 transition-colors duration-300 whitespace-nowrap">
          {item.label}
        </span>
      )}
    </>
  );

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
          <img
            src={logo}
            alt="LetsInsure"
            width={172}
            height={40}
            className="h-10 w-auto object-contain transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] drop-shadow-sm"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2">
        <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
          {NAV_ITEMS.map((item) => (
            <li key={item.label} className="relative">
              {isRoutedPath(item.to) ? (
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
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
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;