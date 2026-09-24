import BannerCard from './BannerCard';
import { KIT_COLUMNS } from '../lib/gridLayout';
import { useAgentFooter } from '../hooks/useAgentFooter';

/**
 * The cards, laid out. Presentational as far as the *list* goes — the section
 * owns loading, error and empty, because those are different sentences and a
 * grid that merged them would say none of them.
 *
 * The one thing it does own is the agent's footer details, and it owns them
 * precisely because it is the only component here that exists once per
 * category. `useAgentFooter` is a shared, deduped read, but each card calling
 * it would still mount its own effects and its own portrait fetch — so it is
 * read here and passed down. That is the hook's stated contract.
 */
function BannerGrid({ banners }) {
  const agent = useAgentFooter();

  return (
    <div className={`grid gap-3 ${KIT_COLUMNS}`}>
      {banners.map((banner) => (
        <BannerCard key={banner.id} banner={banner} agent={agent} />
      ))}
    </div>
  );
}

export default BannerGrid;
