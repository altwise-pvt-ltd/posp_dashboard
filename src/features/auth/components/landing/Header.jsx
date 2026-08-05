import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import BrandButton from "./ui/BrandButton";
import { CONTAINER } from "./ui/Section";

const NAV_LINKS = [
  { label: "Insurance Products", hasChevron: true },
  { label: "Why Lets Insurance", hasChevron: true },
  { label: "Claim", hasChevron: false },
  { label: "Support", hasChevron: false },
];

const LINK =
  "text-sm font-medium text-gray-700 transition-colors hover:text-brand";

function NavLink({ label, hasChevron }) {
  return (
    <button type="button" className={`flex items-center gap-1 ${LINK}`}>
      {label}
      {hasChevron && <ChevronDown size={16} />}
    </button>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className={`flex h-30 items-center justify-between ${CONTAINER}`}>
        <img src={logo} alt="LetsInsurance" className="h-16 w-auto" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.label} {...link} />
          ))}
        </nav>

        {/* <div className="hidden items-center gap-6 lg:flex">
          <button type="button" className={LINK}>
            Become an Agent
          </button>
          <BrandButton size="sm">Login</BrandButton>
        </div> */}

        {/* Mobile hamburger */}
        <button
          type="button"
          className="p-2 text-gray-700 lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-gray-100 bg-white px-4 pb-6 pt-4 lg:hidden"
        >
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.label} {...link} />
            ))}
            <hr className="border-gray-100" />
            <button type="button" className={`text-left ${LINK}`}>
              Become an Agent
            </button>
            <BrandButton size="sm" className="w-full">
              Login
            </BrandButton>
          </nav>
        </div>
      )}
    </header>
  );
}
