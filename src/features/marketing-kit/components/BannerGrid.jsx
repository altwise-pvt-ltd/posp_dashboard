import BannerCard from './BannerCard';
import { KIT_COLUMNS } from '../lib/gridLayout';

/**
 * The banners, laid out. Presentational — the section owns loading, error and
 * empty, because those are different sentences and a grid that merged them
 * would say none of them.
 */
function BannerGrid({ banners }) {
  return (
    <div className={`grid gap-3 ${KIT_COLUMNS}`}>
      {banners.map((banner) => (
        <BannerCard key={banner.id} banner={banner} />
      ))}
    </div>
  );
}

export default BannerGrid;
