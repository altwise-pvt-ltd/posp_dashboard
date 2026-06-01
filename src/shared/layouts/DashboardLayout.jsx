import { useState } from 'react';
import Sidebar from './dashboard/Sidebar';
import Topbar from './dashboard/Topbar';

function DashboardLayout({ children }) {
  // One source of truth for the collapsed/expanded state.
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar — width animates between expanded (w-64) and collapsed (w-20) */}
      <aside
        className={`relative shrink-0 border-r border-slate-200 bg-white p-4 transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Collapse toggle — floats on the right border edge */}
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

        <Sidebar collapsed={collapsed} />
      </aside>

      {/* Right column — topbar + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-slate-200 bg-white px-6">
          <Topbar />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
