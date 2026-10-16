import { useEffect, useState } from 'react';
import { fetchCatalogImage } from '../api/quoteCatalogApi';

/**
 * A catalogue image URL as something an `<img src>` can take. Null while there
 * is no URL, while it loads, and if it fails, so the caller shows its fallback.
 * The object URL is revoked on the way out.
 */
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
