
export default function BottomNavBar({
  items = [],
  activeId,
  onChange,
  className = "",
}) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Primary"
      // Fixed to the viewport bottom is the whole point of the pattern; pass a
      // className to override that when embedding inside a scroll container.
      // The safe-area padding is what keeps the labels clear of the iOS home
      // indicator (~34px) instead of sitting underneath it.
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-3 pb-[env(safe-area-inset-bottom)] ${className}`}
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
