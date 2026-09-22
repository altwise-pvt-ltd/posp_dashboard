import { useState } from 'react';
import { PackageOpen } from 'lucide-react';
import CategoryStrip from './CategoryStrip';
import KitNotice from './KitNotice';
import KitError from './KitError';
import { useCategories } from '../hooks/useCategories';
import { useCategoryItems } from '../hooks/useCategoryItems';

/**
 * One half of the Marketing Kit: a category strip, and that category's items
 * under it. Cards and brochures are the same screen over different endpoints,
 * so they are the same component over different fetchers.
 *
 * `renderItems` and `skeleton` rather than a branch on which half this is — the
 * two grids lay out differently (16:9 landscape against portrait pages) and
 * that is the caller's business, not this component's. They travel together:
 * the skeleton has to use the same column classes as the grid it stands in for,
 * or the swap moves the page.
 *
 * Mounted one at a time, keyed by tab in the page, so switching tabs unmounts
 * this and drops the category selection with it. That is deliberate: a tab
 * remembering a selection made several minutes ago, against a list that may
 * have changed since, is a worse surprise than starting at the first category.
 */
function KitSection({
  fetchCategories,
  fetchItems,
  renderItems,
  emptyLabel,
  itemNoun,
  skeleton,
}) {
  const {
    categories,
    loading: loadingCategories,
    error: categoriesError,
    retry: retryCategories,
  } = useCategories(fetchCategories);

  const [chosenId, setChosenId] = useState(null);

  /**
   * What the agent has tapped, and what is actually shown.
   *
   * They are two values on purpose. `chosenId` is null until the first tap, and
   * the screen should land on the first category rather than on an empty grid
   * asking to be told what to do — so `selectedId` falls back to it. Doing that
   * during render rather than in an effect keeps the first paint correct: an
   * effect would render an unselected strip, then set state, then render again,
   * and firing a request off that cascade is what eslint rejects.
   *
   * The `some` check is the other half. A retry that comes back without the
   * chosen category — renamed, retired — would otherwise leave `chosenId`
   * pointing at something no longer offered, with nothing selected in the strip
   * while the grid fetched it anyway.
   */
  const selectedId = categories.some((c) => c.id === chosenId)
    ? chosenId
    : (categories[0]?.id ?? null);

  const { items, loading, error, retry } = useCategoryItems(fetchItems, selectedId);

  if (loadingCategories) {
    /* The first load gets the same treatment as a category switch: placeholder
       chips over the placeholder grid, holding the full height. A spinner here
       meant the panel opened short and then jumped once — the very jump the
       skeletons below were added to stop. */
    return (
      <div className="flex flex-col gap-4">
        <div aria-hidden="true" className="flex flex-wrap gap-2">
          {[64, 88, 72].map((width) => (
            <div
              key={width}
              style={{ width }}
              className="h-9 animate-pulse rounded-full bg-surface-container"
            />
          ))}
        </div>
        {skeleton}
      </div>
    );
  }

  if (categoriesError) {
    return (
      <KitError
        error={categoriesError}
        fallback="Couldn't load the categories."
        onRetry={retryCategories}
      />
    );
  }

  if (categories.length === 0) {
    return (
      <KitNotice>
        <PackageOpen aria-hidden="true" className="size-6" />
        <p>Nothing has been published yet. Check back soon.</p>
      </KitNotice>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CategoryStrip categories={categories} selectedId={selectedId} onSelect={setChosenId} />

      {/* How much is in the category you are looking at, before you scroll to
          find out. Rendered only once the rows are real — a count beside a
          skeleton would be a number the screen does not yet know. */}
      {!loading && !error && items.length > 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant">
          {items.length} {items.length === 1 ? itemNoun : `${itemNoun}s`}
        </p>
      )}

      {/* The items half. Deliberately below the strip rather than replacing it,
          so switching category stays available even from an error state. */}
      {loading ? (
        skeleton
      ) : error ? (
        <KitError error={error} fallback="Couldn't load this category." onRetry={retry} />
      ) : items.length === 0 ? (
        <KitNotice>
          <PackageOpen aria-hidden="true" className="size-6" />
          <p>{emptyLabel}</p>
        </KitNotice>
      ) : (
        renderItems(items)
      )}
    </div>
  );
}

export default KitSection;
