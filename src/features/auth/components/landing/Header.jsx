import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const NAV_LINKS = [
  { label: "Insurance Products", hasChevron: true },
  { label: "Why Lets Insurance", hasChevron: true },
  { label: "Claim", hasChevron: false },
  { label: "Support", hasChevron: false },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <img src={logo} alt="LetsInsurance" className="h-10 w-auto" />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#f47c3c] transition-colors"
            >
              {link.label}
              {link.hasChevron && <ChevronDown size={16} />}
            </button>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-6">
          <button
            type="button"
            className="text-sm font-medium text-gray-700 hover:text-[#f47c3c] transition-colors"
          >
            Become an Agent
          </button>
          <button
            type="button"
            className="rounded-xl bg-[#f47c3c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e06a2e] transition-colors"
          >
            Login
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="lg:hidden p-2 text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 pb-6 pt-4">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#f47c3c] transition-colors"
              >
                {link.label}
                {link.hasChevron && <ChevronDown size={16} />}
              </button>
            ))}
            <hr className="border-gray-100" />
            <button
              type="button"
              className="text-sm font-medium text-gray-700 hover:text-[#f47c3c] transition-colors text-left"
            >
              Become an Agent
            </button>
            <button
              type="button"
              className="rounded-xl bg-[#f47c3c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e06a2e] transition-colors w-full"
            >
              Login
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
