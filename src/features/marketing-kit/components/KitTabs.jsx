/**
 * Cards or brochures — the top-level switch.
 *
 * Underlined rather than the pills this started as. The category chips below
 * are pills too, and two rows of orange-when-active pills gave no clue which
 * level you were changing; an underline reads as "section", a pill as "filter",
 * and the two stop competing.
 *
 * Two lists with separate taxonomies and separate endpoints, so they are two
 * tabs rather than one merged grid: a card and a brochure are different things
 * to an agent, and a category id from one is meaningless to the other.
 */
function KitTabs({ tabs, activeId, onSelect }) {
  return (
    <div
      role="tablist"
      aria-label="Marketing Kit sections"
      className="flex gap-4 border-b border-gray-200 sm:gap-6"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect?.(tab.id)}
            className={[
              /* `body-lg` on a phone: `headline-md` is 20px and two tabs at
                 that weight dominate a screen whose actual subject is the grid
                 below them. */
              'font-body-lg text-body-lg sm:font-headline-md sm:text-headline-md',
              'relative -mb-px border-b-2 px-1 pb-3 transition sm:pb-2.5',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              active
                ? 'border-primary text-on-surface'
                : 'border-transparent text-on-surface-variant hover:border-gray-300 hover:text-on-surface',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default KitTabs;
