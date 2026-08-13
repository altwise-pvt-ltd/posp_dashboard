import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Breadcrumb — the trail that lets a user step back up the funnel.
 *
 * Same pill the onboarding wizard renders below its stepper, lifted into a
 * shared component so every page in the pre-dashboard flow gets an identical
 * one instead of a hand-rolled copy.
 *
 * `items` runs root → current, and the LAST entry is always the page you are
 * on: it renders as plain text, never a link, and carries aria-current="page".
 * Give the earlier entries either `to` (an in-app route) or `href` (an external
 * URL); an entry with neither renders inert, which is how you show a stage that
 * exists in the journey but has no page to go back to.
 *
 *   <Breadcrumb items={[
 *     { label: "Home", href: "https://www.letsinsurance.com/", icon: Home },
 *     { label: "On Boarding", to: "/onboarding" },
 *     { label: "Verification" },
 *   ]} />
 */
export default function Breadcrumb({ items = [], className = "" }) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5 text-sm ${className}`}
    >
      {items.map(({ label, to, href, icon: Icon }, index) => {
        const isCurrent = index === items.length - 1;

        // The icon sits inside whichever element ends up wrapping the label, so
        // it is authored once here rather than in all three branches below.
        const content = (
          <>
            {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" />}
            {label}
          </>
        );

        return (
          <span key={label} className="inline-flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight size={14} className="text-slate-300" aria-hidden="true" />
            )}

            {isCurrent ? (
              <span aria-current="page" className="font-semibold text-slate-700">
                {content}
              </span>
            ) : to ? (
              <Link
                to={to}
                className="flex items-center gap-1.5 font-medium text-slate-500 transition-colors duration-200 hover:text-orange-500"
              >
                {content}
              </Link>
            ) : href ? (
              <a
                href={href}
                className="flex items-center gap-1.5 font-medium text-slate-500 transition-colors duration-200 hover:text-orange-500"
              >
                {content}
              </a>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-slate-400">
                {content}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
