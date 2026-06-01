import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';
import iconHome from '@/assets/sidebar/OverviewScreen.png';
import iconCustomers from '@/assets/sidebar/Customer.png';
import iconPolicies from '@/assets/sidebar/Policies.png';
import iconReports from '@/assets/sidebar/Reports.png';
import renewal from '@/assets/sidebar/renewal.png';
import Profile from '@/assets/sidebar/profile.png';

// `to` is the route path each link navigates to. Only '/' and '/profile'
// have real pages today; the others fall through App.jsx's catch-all
// redirect until their pages exist.
const NAV_ITEMS = [
  { label: 'Home', to: '/', icon: iconHome },
  { label: 'Customers', to: '/customers', icon: iconCustomers },
  { label: 'Policies', to: '/policies', icon: iconPolicies },
  { label: 'Reports', to: '/reports', icon: iconReports },
  { label: 'Renewal', to: '/renewal', icon: renewal },
  { label: 'Profile', to: '/profile', icon: Profile },
];

function Sidebar({ collapsed = false }) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand Logo Container */}
      <div
        className={`flex items-center pb-6 pt-3 select-none ${
          collapsed ? 'justify-center px-0' : 'px-3'
        }`}
      >
        {collapsed ? (
          // Compact brand mark — a centered square badge so the wide
          // wordmark never gets squished into the narrow rail.
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-base font-bold text-white shadow-[0_4px_12px_rgba(249,115,22,0.25)] transition-all duration-300 hover:scale-105 active:scale-95">
            L
          </div>
        ) : (
          <img
            src={logo}
            alt="LetsInsure"
            className="h-10 w-auto object-contain transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] drop-shadow-sm"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2">
        <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
          {NAV_ITEMS.map((item) => (
            <li key={item.label} className="relative">
              <NavLink
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `relative flex items-center rounded-xl text-sm font-medium transition-all duration-300 group select-none ${
                    collapsed
                      ? 'mx-auto h-12 w-12 justify-center'
                      : 'gap-3.5 px-4 py-3'
                  } ${
                    isActive
                      ? 'text-black font-semibold'
                      : `text-slate-500 hover:text-slate-900 ${
                          collapsed
                            ? 'hover:bg-slate-100/70'
                            : 'hover:translate-x-1'
                        }`
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Sliding Background Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-orange-50 to-amber-50/50 border border-orange-100/70 rounded-xl shadow-[0_4px_12px_rgba(249,115,22,0.06)]"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Left Accent Bar — only in expanded mode (looks awkward on the narrow rail) */}
                    {isActive && !collapsed && (
                      <motion.div
                        layoutId="activeLeftBar"
                        className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-orange-500 to-amber-500 rounded-r-full"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Icon */}
                    {item.icon && (
                      <img
                        src={item.icon}
                        alt=""
                        className={`w-6 h-6 shrink-0 object-contain transition-all duration-300 relative z-10 ${
                          isActive
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
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;