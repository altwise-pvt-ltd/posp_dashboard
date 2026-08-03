import logo from "@/assets/onboarding/LetsLogoFooterSvg.svg";
import { Building2, MapPin, ShieldCheck } from "lucide-react";

/* Link columns. No marketing pages exist behind these yet, so every item is
   rendered inert (see LinkList) — a real <a href="#"> would jump to top and
   leave a stray '#' in the URL. Swap the <span> for <Link to=...> per item as
   the pages land. */
const LINK_COLUMNS = [
  {
    heading: "Insurance",
    links: [
      "Motor Insurance",
      "Health Insurance",
      "Term Insurance",
      "Business Insurance",
      "Home Insurance",
    ],
  },
  {
    heading: "Support",
    links: ["Claims Assistance", "Contact Us", "FAQs", "Become a POSP"],
  },
  {
    heading: "Company",
    links: [
      "About Us",
      "Privacy Policy",
      "Terms & Conditions",
      "IRDAI Disclosure",
    ],
  },
];

const LEGAL_LINKS = ["Privacy Policy", "Terms & Conditions", "Cookie Policy"];

/* lucide-react v1 removed its brand icons, so the four socials are authored
   inline. All four share one 24-box viewBox and inherit currentColor. */
const SOCIALS = [
  {
    label: "Facebook",
    icon: (
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    ),
  },
  {
    label: "Instagram",
    icon: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </>
    ),
  },
  {
    label: "LinkedIn",
    icon: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
  {
    label: "YouTube",
    icon: (
      <>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </>
    ),
  },
];

/** Column heading + short orange rule, repeated across the three link columns. */
function ColumnHeading({ children }) {
  return (
    <>
      <h3 className="text-base font-semibold text-white">{children}</h3>
      <span className="mt-2 mb-4 block h-0.75 w-8 rounded-full bg-orange-500" />
    </>
  );
}

/** Inert link list — each row carries a hairline separator like the design. */
function LinkList({ links }) {
  return (
    <ul className="flex flex-col">
      {links.map((link) => (
        <li key={link} className="border-b border-white/10 last:border-b-0">
          <span
            aria-disabled="true"
            className="block cursor-default py-3 text-sm text-slate-300 transition-colors duration-150 hover:text-orange-400"
          >
            {link}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Outlined orange icon tile used by the three entity/address/commitment blocks. */
function InfoIcon({ icon: Icon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/45 text-orange-500">
      <Icon size={18} strokeWidth={1.75} />
    </span>
  );
}

/**
 * OnboardingFooter — the shared site footer rendered at the bottom of the login
 * page and every onboarding page.
 *
 * Three stacked bands, each split by a hairline rule:
 *   1. brand + socials, then the Insurance / Support / Company link columns
 *   2. regulatory identity — entity + CIN/IRDAI, registered address, commitment
 *   3. copyright + legal links
 *
 * Responsive: everything stacks in one column on phones, goes two-up from `sm`,
 * and lands on the 4-column desktop layout (with vertical dividers) from `lg`.
 */
export default function OnboardingFooter() {
  return (
    <footer className="bg-[#0A1C36] font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 2xl:max-w-384 2xl:px-12">
        {/* ── Band 1: brand + link columns ───────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-0 lg:py-12">
          {/* Brand Logo*/}
          <div className="lg:pr-16">
            <img
              src={logo}
              alt="Lets Insurance — protecting you and yours"
              className="h-16 w-auto "
            />
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">
              Compare, buy and manage insurance policies online with expert
              guidance, best prices and dedicated claim support.
            </p>

            <p className="mt-6 text-sm text-slate-300">Follow us on</p>
            <div className="mt-3 flex items-center gap-3">
              {SOCIALS.map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-full border border-white/15 text-slate-200 transition-colors duration-150 hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4.5"
                    aria-hidden="true"
                  >
                    {icon}
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Link columns — the vertical rule only exists once they sit side by
              side, hence the lg: prefix. */}
          {LINK_COLUMNS.map(({ heading, links }) => (
            <div
              key={heading}
              className="lg:border-l lg:border-white/10 lg:px-8"
            >
              <ColumnHeading>{heading}</ColumnHeading>
              <LinkList links={links} />
            </div>
          ))}
        </div>

        {/* ── Band 2: regulatory identity ────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 border-t border-white/10 py-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-3.5">
            <InfoIcon icon={Building2} />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-white">
                ALTSURE INSURANCE BROKERS PRIVATE LIMITED
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                CIN:{" "}
                <span className="text-orange-400">U66220PN2022PTC215072</span>
              </p>
              <p className="text-xs text-slate-400">
                IRDAI License Number:{" "}
                <span className="text-orange-400">1163</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3.5">
            <InfoIcon icon={MapPin} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                Registered Address
              </p>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                SR.NO.38/4, A/1, F.P.486, BLDG-A FL-1202, KUMAR SURBHI, OPP.
                SAIBABA MANDIR, Pune, Maharashtra – 411009
              </p>
            </div>
          </div>

          <div className="flex gap-3.5">
            <InfoIcon icon={ShieldCheck} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Our Commitment</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                Your trust is our priority. We are here to protect what matters
                most to you.
              </p>
            </div>
          </div>
        </div>

        {/* ── Band 3: copyright + legal ──────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 border-t border-white/10 py-5 text-center sm:flex-row sm:justify-between sm:gap-2 sm:text-left">
          <p className="text-xs text-slate-400">
            © 2026 <span className="text-orange-400">LetsInsurance.com</span>.
            All Rights Reserved.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((link, i) => (
              <span key={link} className="flex items-center gap-x-4">
                {i > 0 && (
                  <span aria-hidden="true" className="text-white/20">
                    |
                  </span>
                )}
                <span
                  aria-disabled="true"
                  className="cursor-default text-xs text-slate-300 transition-colors duration-150 hover:text-orange-400"
                >
                  {link}
                </span>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
