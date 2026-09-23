import BrochureCard from './BrochureCard';
import { KIT_COLUMNS } from '../lib/gridLayout';

/** Presentational, same as `BannerGrid` — the section owns every other state. */
function BrochureGrid({ brochures }) {
  return (
    <div className={`grid gap-3 ${KIT_COLUMNS}`}>
      {brochures.map((brochure) => (
        <BrochureCard key={brochure.id} brochure={brochure} />
      ))}
    </div>
  );
}

export default BrochureGrid;
