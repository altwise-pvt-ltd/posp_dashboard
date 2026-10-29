import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { insurerInitials } from '../lib/insurerResponse';

// Falls back to initials (or an icon) when there's no logo or it fails to load.
function InsurerLogo({ url, name }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const initials = insurerInitials(name);

  if (url && failedUrl !== url) {
    return (
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-white"
      >
        <img
          src={url}
          alt=""
          className="size-full object-contain p-1"
          onError={() => setFailedUrl(url)}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-well-deep text-sm font-semibold text-ink-subtle"
    >
      {initials ?? <Building2 className="size-5" />}
    </span>
  );
}

export default InsurerLogo;
