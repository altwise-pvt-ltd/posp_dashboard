import { motion } from 'framer-motion';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { useMatchMedia, MOBILE_QUERY } from '@/shared/hooks/useMatchMedia';

const PILL =
  'inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-white/90';

/**
 * Shows one document from a URL on a dark backdrop. `kind` comes from documentKind(). Android Chrome can't render a PDF in an
 * iframe, so phones get a link out. Other types get a Download button if `onDownload` is
 * given, else the same link out.
 */
function DocumentStage({ url, kind, title, onDownload }) {
  const isMobile = useMatchMedia(MOBILE_QUERY);

  if (kind === 'image') {
    return (
      <motion.img
        key={url}
        src={url}
        alt={title}
        draggable={false}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
      />
    );
  }

  if (kind === 'pdf' && !isMobile) {
    return (
      <iframe src={url} title={title} className="size-full max-w-5xl rounded-lg bg-white shadow-2xl" />
    );
  }

  if (kind !== 'pdf' && onDownload) {
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white/80">
        <FileText className="size-10" aria-hidden="true" />
        <p className="text-sm">No preview for this file type.</p>
        <button type="button" onClick={onDownload} className={PILL}>
          <Download className="size-4" aria-hidden="true" />
          Download
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center text-white/80">
      <FileText className="size-10" aria-hidden="true" />
      <p className="text-sm">This file opens in your phone&apos;s viewer.</p>
      <a href={url} target="_blank" rel="noreferrer" className={PILL}>
        <ExternalLink className="size-4" aria-hidden="true" />
        Open file
      </a>
    </div>
  );
}

export default DocumentStage;
