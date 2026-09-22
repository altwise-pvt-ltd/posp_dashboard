import BrochureCard from './BrochureCard';
import { useAgentSignature } from '../hooks/useAgentSignature';
import { KIT_COLUMNS } from '../lib/gridLayout';

/** Presentational, same as `BannerGrid` — the section owns every other state. */
function BrochureGrid({ brochures }) {
  const agent = useAgentSignature();

  return (
    <div className={`grid gap-3 ${KIT_COLUMNS}`}>
      {brochures.map((brochure) => (
        <BrochureCard key={brochure.id} brochure={brochure} agent={agent} />
      ))}
    </div>
  );
}

export default BrochureGrid;
