import { useEffect, useState } from 'react';
import { fetchCatalogImage } from '@/shared/api/quoteCatalogApi';

// Fetches a catalog image into an object URL; null while loading or on failure. Revoked on cleanup.
export function useCatalogImage(url) {
  const [image, setImage] = useState({ url: null, src: null });

  useEffect(() => {
    if (!url) return undefined;

    let live = true;
    let objectUrl = null;

    fetchCatalogImage(url)
      .then((blob) => {
        if (!live) return;
        objectUrl = URL.createObjectURL(blob);
        setImage({ url, src: objectUrl });
      })
      .catch(() => {});

    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return url && image.url === url ? image.src : null;
}
