
// Everything except where the bar sits. `className` carries the positioning so
// a consumer can move it without fighting a `fixed` baked into the base string
// — two `position` utilities in one class list are resolved by CSS order, not
// by which one was appended last, so overriding rather than replacing is not
// reliable.
const BASE =
  "border-t border-slate-200 bg-white px-3 pb-[env(safe-area-inset-bottom)]";

export default function BottomNavBar({
  items = [],
  activeId,
  onChange,
  // Fixed to the viewport bottom is the default reading of the pattern. Pass
  // your own positioning when the bar lives inside a flex shell that already
  // scrolls its content (see DashboardLayout), where in-flow beats fixed: the
  // content column simply gets shorter instead of every page needing bottom
  // padding to clear an overlay.
  className = "fixed inset-x-0 bottom-0 z-40",
}) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Primary"
      // The safe-area padding above is what keeps the labels clear of the iOS
      // home indicator (~34px) instead of sitting underneath it. It only
      // resolves to a real value because index.html asks for `viewport-fit=cover`.
      className={`${BASE} ${className}`}
    >
      <ul className="flex items-stretch">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeId;

          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange?.(id)}
                aria-current={isActive ? "page" : undefined}
                // min-h-[58px] is the bar height, and with flex-1 above it the
                // button fills the whole tab — so the tap area is the tab, not
                // just the 24px icon.
                className={`flex min-h-[58px] w-full flex-col items-center justify-center gap-1.5 transition-colors duration-200 ${
                  isActive
                    ? "text-orange-500"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {Icon && (
                  <Icon
                    size={24}
                    // Two properties change between states (colour above and
                    // weight here) so the active tab reads at a glance.
                    strokeWidth={isActive ? 2.25 : 1.75}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`text-[11px] leading-none ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
