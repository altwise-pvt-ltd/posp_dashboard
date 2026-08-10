import { useId, useState } from "react";
import logo from "@/assets/onboarding/LetsLogoFooterSvg.svg";
import { Building2, ChevronDown, MapPin, ShieldCheck } from "lucide-react";

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
      <h3 className="text-[12.5px] font-semibold text-white">{children}</h3>
      <span className="mt-1 mb-1.5 block h-0.5 w-7 rounded-full bg-orange-500" />
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
            className="block cursor-default py-3 text-sm text-slate-300 transition-colors duration-150 hover:text-orange-400 sm:py-1 sm:text-[12.5px]"
          >
            {link}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * LinkColumn — one group of footer links.
 *
 * Below `sm` the group collapses to a single tappable row, so the three groups
 * read as 3 lines instead of 16 and the footer stops running on for most of a
 * screen. From `sm` up it's the always-open column the desktop design shows.
 *
 * The heading is authored twice rather than one element that changes role at
 * the breakpoint: the mobile one is a real disclosure button, and reporting
 * aria-expanded="false" over a permanently visible desktop list would be a lie.
 * `hidden` is display:none, so the unused one is out of the a11y tree entirely
 * and nothing is announced twice.
 */
function LinkColumn({ heading, links }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-t border-white/10 last:border-b sm:border-0 lg:border-l lg:border-white/10 lg:px-6">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-2 py-3.5 text-left sm:hidden"
      >
        <span className="text-sm font-semibold text-white">{heading}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-orange-400" : "text-slate-400"
          }`}
        />
      </button>

      <div className="hidden sm:block">
        <ColumnHeading>{heading}</ColumnHeading>
      </div>

      <div
        id={panelId}
        className={`pb-2 sm:block sm:pb-0 ${open ? "" : "hidden"}`}
      >
        <LinkList links={links} />
      </div>
    </div>
  );
}

/**
 * Outlined orange icon tile used by the three entity/address/commitment blocks.
 * `compact` is the mobile fine-print size — a notch smaller than the tile used
 * from sm up, where the three blocks are equal columns again.
 */
function InfoIcon({ icon: Icon, compact = false }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl border border-orange-500/45 text-orange-500 ${
        compact ? "size-6 sm:size-7" : "size-7"
      }`}
    >
      <Icon
        className={compact ? "size-3 sm:size-3.5" : "size-3.5"}
        strokeWidth={1.75}
      />
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
        {/* Mobile runs brand and links as two tracks, so the collapsed groups
            fill the space beside the brand block instead of queueing below it.
            The brand track is the wider of the two — it carries the blurb,
            while a group row only has to fit "Insurance" and a chevron. */}
        <div className="grid grid-cols-[1.2fr_1fr] gap-x-5 py-8 sm:grid-cols-2 sm:gap-6 sm:py-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-0 lg:py-5">
          {/* Brand Logo*/}
          <div className="lg:pr-12">
            <img
              src={logo}
              alt="Lets Insurance — protecting you and yours"
              width={268}
              height={56}
              className="h-11 w-auto sm:h-10"
            />
            <p className="mt-3 max-w-xs text-xs leading-5 text-slate-400 sm:text-[11px] sm:leading-4.5">
              Compare, buy and manage insurance policies online with expert
              guidance, best prices and dedicated claim support.
            </p>

            <p className="mt-4 text-xs text-slate-300 sm:mt-3.5 sm:text-[11px]">
              Follow us on
            </p>
            {/* flex-wrap is the safety net: four 32px targets plus gaps just
                fit the brand track on a 320px screen, and wrap rather than
                overflow if the viewport is narrower still. */}
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-2.5">
              {SOCIALS.map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className="flex size-8 items-center justify-center rounded-full border border-white/15 text-slate-200 transition-colors duration-150 hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                    aria-hidden="true"
                  >
                    {icon}
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Link columns — collapsed on phones, open from sm. The vertical
              rule only exists once they sit side by side, hence the lg: prefix
              inside LinkColumn.

              The wrapper stacks the three groups into the grid's second track
              on mobile, then `sm:contents` dissolves it so they go back to
              being direct grid items and the sm/lg column layouts are the ones
              the design already had. */}
          <div className="flex flex-col sm:contents">
            {LINK_COLUMNS.map(({ heading, links }) => (
              <LinkColumn key={heading} heading={heading} links={links} />
            ))}
          </div>
        </div>

        {/* ── Band 2: regulatory identity ────────────────────────────── */}
        {/* A plain vertical list on mobile, all three blocks at the ~70%
            fine-print size with the address leading. The sm:order-* values put
            the columns back in the original left-to-right sequence from sm up,
            so promoting the address is a mobile change only. */}
        <div className="flex flex-col gap-5 border-t border-white/10 py-8 sm:grid sm:grid-cols-2 sm:gap-6 sm:py-4 lg:grid-cols-3">
          <div className="flex gap-2.5 sm:order-2 sm:gap-3">
            <InfoIcon icon={MapPin} compact />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white">
                Registered Address
              </p>
              <p className="mt-1 text-[10px] leading-[14px] text-slate-400">
                SR.NO.38/4, A/1, F.P.486, BLDG-A FL-1202, KUMAR SURBHI, OPP.
                SAIBABA MANDIR, Pune, Maharashtra – 411009
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 sm:order-1 sm:gap-3">
            <InfoIcon icon={Building2} compact />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-4 text-white sm:leading-3.5">
                ALTSURE INSURANCE BROKERS PRIVATE LIMITED
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                CIN:{" "}
                <span className="text-orange-400">U66220PN2022PTC215072</span>
              </p>
              <p className="text-[10px] text-slate-400">
                IRDAI License Number:{" "}
                <span className="text-orange-400">1163</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 sm:order-3 sm:gap-3">
            <InfoIcon icon={ShieldCheck} compact />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white">
                Our Commitment
              </p>
              <p className="mt-1 text-[10px] leading-[14px] text-slate-400">
                Your trust is our priority. We are here to protect what matters
                most to you.
              </p>
            </div>
          </div>
        </div>

        {/* ── Band 3: copyright + legal ──────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 border-t border-white/10 py-5 text-center sm:flex-row sm:justify-between sm:gap-2 sm:py-3 sm:text-left">
          <p className="text-xs text-slate-400 sm:text-[10px]">
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
                  className="cursor-default text-xs text-slate-300 transition-colors duration-150 hover:text-orange-400 sm:text-[10px]"
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
