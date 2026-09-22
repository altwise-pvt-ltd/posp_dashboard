import { useState } from 'react';
import DashboardLayout from '@/shared/layouts/DashboardLayout';
import KitTabs from '../components/KitTabs';
import KitSection from '../components/KitSection';
import KitSkeleton from '../components/KitSkeleton';
import BannerGrid from '../components/BannerGrid';
import BrochureGrid from '../components/BrochureGrid';
import { KIT_COLUMNS } from '../lib/gridLayout';
import {
  fetchBanners,
  fetchBrochureCategories,
  fetchBrochures,
  fetchCategories,
} from '../api/marketingKitApi';

/**
 * Marketing Kit — the artwork and documents a POSP can share with customers.
 *
 * Two halves over four endpoints, and `KitSection` is both of them: each is a
 * category list with items underneath, differing only in which calls they make
 * and how the items are drawn.
 *
 * The section is keyed by tab, so switching remounts it and drops the category
 * selection with it — each tab opens at its own first category.
 *
 * Fetchers are module-level functions passed by reference, not wrapped inline —
 * `useCategories` and `useCategoryItems` both depend on the identity of what
 * they are given, and an arrow defined in this render would refetch on every
 * one of them.
 */
const TABS = [
  { id: 'cards', label: 'Cards' },
  { id: 'brochures', label: 'Brochures' },
];

const renderBanners = (items) => <BannerGrid banners={items} />;
const renderBrochures = (items) => <BrochureGrid brochures={items} />;

/* Built once at module scope, not per render — it is static markup, and the
   columns must match the list it stands in for or the swap from placeholder to
   real rows moves the page. One skeleton now both grids share a footprint. */
const KIT_SKELETON = <KitSkeleton columns={KIT_COLUMNS} count={6} />;

function MarketingKitPage() {
  const [tab, setTab] = useState('cards');

  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col gap-gutter">
        <header className="anim-fade">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Marketing Kit</h1>
          <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
            Cards and brochures you can share with your customers.
          </p>
        </header>

        {/* Tabs sit on the panel rather than above it. Floating an underlined
            row over a bordered card left the underline pointing at a gap; on
            the panel it reads as what it is — the panel's own header. */}
        <section className="anim-fade-d1 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="px-4 pt-3 sm:px-gutter">
            <KitTabs tabs={TABS} activeId={tab} onSelect={setTab} />
          </div>

          <div className="p-4 sm:p-gutter">
            {tab === 'cards' ? (
              <KitSection
                key="cards"
                fetchCategories={fetchCategories}
                fetchItems={fetchBanners}
                renderItems={renderBanners}
                skeleton={KIT_SKELETON}
                itemNoun="card"
                emptyLabel="No cards in this category yet."
              />
            ) : (
              <KitSection
                key="brochures"
                fetchCategories={fetchBrochureCategories}
                fetchItems={fetchBrochures}
                renderItems={renderBrochures}
                skeleton={KIT_SKELETON}
                itemNoun="brochure"
                emptyLabel="No brochures in this category yet."
              />
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default MarketingKitPage;
