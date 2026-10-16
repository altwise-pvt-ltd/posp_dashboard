import { createElement } from 'react';
import { useCatalogImage } from '../hooks/useCatalogImage';
import { iconFor } from '../lib/lobIcon';

// Uses the LOB's uploaded icon when it has one, otherwise the matching glyph.
function LobIcon({ lob, size, strokeWidth, className = '' }) {
  const src = useCatalogImage(lob.iconUrl);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={`object-contain ${className}`}
      />
    );
  }

  return createElement(iconFor(lob), { size, strokeWidth, 'aria-hidden': true, className });
}

export default LobIcon;
