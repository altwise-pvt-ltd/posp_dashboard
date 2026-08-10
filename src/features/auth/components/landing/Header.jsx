import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import logo from "@/assets/let'sInsuranceLogo.svg";
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
      {hasChevron && <ChevronDown className="size-4" />}
    </button>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    /* Mobile carries a warm ambient glow under the bar instead of the neutral
       grey shadow — low alpha and a wide blur so it reads as light, not a line. */
    <header className="landing-header sticky top-0 z-50 bg-white shadow-[0_6px_20px_-8px_rgba(244,124,60,0.45)] lg:shadow-sm">
      <div className={`flex h-18 items-center justify-between lg:h-17 ${CONTAINER}`}>
        {/* The mark is a wide 172×40 lockup, so width drives the size and height
            follows the ratio. lg sits at the SVG's native width. Mobile reads
            odd at w-47 because its units are 15% smaller under landing-scale —
            that lands on 160px, the size the bar is meant to show. */}
        <img
          src={logo}
          alt="LetsInsurance"
          width={172}
          height={40}
          className="h-auto w-50 lg:w-43"
        />

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

        {/* Mobile: login sits in the bar itself, so it stays reachable without
            opening the menu — it's the page's primary action. */}
        <div className="flex items-center gap-1 lg:hidden">
          <BrandButton
            size="sm"
            className="px-5 py-2.5"
            onClick={() => {
              const el = document.getElementById("login-form");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
          >
            Login
          </BrandButton>

          <button
            type="button"
            className="p-2 text-gray-700"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {/* Sized by class, not lucide's px `size` prop, so the mobile
                landing-scale variables reach it. */}
            {mobileOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>
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
          </nav>
        </div>
      )}
    </header>
  );
}
