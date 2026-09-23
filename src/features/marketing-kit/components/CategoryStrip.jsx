/**
 * The categories, as a row of chips above the grid.
 *
 * Chips rather than the cards this started as: once picking a category swaps
 * the content below it, the list is a filter and not a destination, and it has
 * to stay on screen while the agent looks at the result.
 *
 * `role="tablist"` because that is what this is — one selected item governing
 * the panel underneath. `aria-selected` carries the state that colour alone
 * would leave to sighted users.
 */
function CategoryStrip({ categories, selectedId, onSelect }) {
  return (
    <div
      role="tablist"
      aria-label="Marketing categories"
      /* Wraps rather than scrolling sideways. A horizontal scroller kept the
         row one line tall, but categories past the right edge were invisible
         with nothing to say they existed — and a sideways swipe over a region
         that also scrolls the page is easy to miss on a phone. Every category
         is now on screen, across as many lines as it takes. */
      className="flex flex-wrap gap-2"
    >
      {categories.map((category) => {
        const selected = category.id === selectedId;

        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={selected}
            title={category.description || undefined}
            onClick={() => onSelect?.(category.id)}
            className={[
              /* Taller on a phone: these are the screen's main control and get
                 tapped most, so they are sized as thumb targets. */
              'font-body-md text-body-md rounded-full border px-4 py-2.5 transition sm:py-2',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              /* Selection is brand-orange, not the dark `on-surface` this
                 started as — the sidebar's active child and the primary button
                 both say orange, and a filter chip is the same kind of "this
                 one" signal. */
              selected
                ? 'border-transparent bg-primary text-on-primary'
                : 'border-gray-200 bg-white text-on-surface-variant hover:border-gray-300',
            ].join(' ')}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryStrip;
