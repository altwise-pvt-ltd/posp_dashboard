import { FileText, ImageIcon } from 'lucide-react';
import { useDocumentBlob } from '../hooks/useDocumentBlob';
import { isImage, isPdf } from '../api/quoteDocumentListApi';

/**
 * Image thumbnail fetched with the bearer token; an icon for anything else.
 * Cards show the whole image (`contain`); the compact filmstrip fills (`cover`).
 */
function DocumentThumbnail({ quoteId, doc, compact = false }) {
  const image = isImage(doc);
  const { url, loading } = useDocumentBlob(quoteId, image ? doc : null);

  if (image && url) {
    return (
      <img
        src={url}
        alt=""
        draggable={false}
        className={compact ? 'size-full object-cover' : 'size-full object-contain p-3'}
      />
    );
  }

  if (image && loading) {
    return <div className="size-full animate-pulse bg-black/5" aria-hidden="true" />;
  }

  const Icon = image ? ImageIcon : FileText;

  return (
    <div className="flex size-full flex-col items-center justify-center gap-1 text-current opacity-70">
      <Icon className={compact ? 'size-4' : 'size-8'} aria-hidden="true" />
      {!compact && isPdf(doc) && <span className="text-xs font-semibold uppercase">PDF</span>}
    </div>
  );
}

export default DocumentThumbnail;
