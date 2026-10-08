import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  TriangleAlert,
  X,
} from 'lucide-react';
import { saveBlob } from '@/shared/lib/saveFile';
import { useDocumentBlob } from '../hooks/useDocumentBlob';
import { formatBytes, isImage, isPdf } from '../api/quoteDocumentListApi';
import { formatDate } from '../lib/quotationFormat';
import DocumentThumbnail from './DocumentThumbnail';

const TOOL =
  'inline-flex size-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50';

const ARROW =
  'absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:inline-flex';

function Stage({ document, file }) {
  if (file.loading) {
    return (
      <div className="flex flex-col items-center gap-3 text-white/70">
        <Loader2 className="size-8 animate-spin" aria-hidden="true" />
        <p className="text-sm">Loading document…</p>
      </div>
    );
  }

  if (file.error) {
    return (
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-white/5 px-6 py-8 text-center text-white">
        <TriangleAlert className="size-8 text-amber-400" aria-hidden="true" />
        <p className="text-sm text-white/80">
          {file.error.message || "This document couldn't be loaded."}
        </p>
        <button
          type="button"
          onClick={file.retry}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-white/90"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  if (!file.url) return null;

  if (isImage(document) || file.blob?.type?.startsWith('image/')) {
    return (
      <motion.img
        key={file.url}
        src={file.url}
        alt={document.fileName}
        draggable={false}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
      />
    );
  }

  if (isPdf(document) || file.blob?.type === 'application/pdf') {
    return (
      <iframe
        src={file.url}
        title={document.fileName}
        className="size-full max-w-5xl rounded-lg bg-white shadow-2xl"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center text-white/80">
      <FileText className="size-10" aria-hidden="true" />
      <p className="text-sm">No preview for this file type.</p>
      <button
        type="button"
        onClick={() => saveBlob(file.blob, document.fileName)}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-white/90"
      >
        <Download className="size-4" aria-hidden="true" />
        Download
      </button>
    </div>
  );
}

/**
 * Full-screen viewer for a quote's documents. Portalled to <body> so the
 * page's animated (transformed) sections can't trap its fixed positioning.
 */
function DocumentPreviewDialog({ quoteId, documents, index, labelFor, onClose, onNavigate }) {
  const document = index == null ? null : documents[index];
  const file = useDocumentBlob(quoteId, document?.id ?? null);

  const open = Boolean(document);
  const hasPrev = open && index > 0;
  const hasNext = open && index < documents.length - 1;

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1);
      if (event.key === 'ArrowRight' && hasNext) onNavigate(index + 1);
    };

    const body = window.document.body;
    const savedOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    window.document.addEventListener('keydown', onKeyDown);

    return () => {
      body.style.overflow = savedOverflow;
      window.document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, index, hasPrev, hasNext, onClose, onNavigate]);

  const meta = document
    ? [formatBytes(document.sizeBytes), document.uploadedAt && `Uploaded ${formatDate(document.uploadedAt)}`]
        .filter(Boolean)
        .join(' · ')
    : '';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="document-preview-title"
          className="fixed inset-0 z-60 flex flex-col bg-slate-950/95 backdrop-blur-sm"
        >
          {/* Top bar */}
          <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-status-pill font-semibold uppercase tracking-wider text-white/50">
                {labelFor(document)}
              </p>
              <h2
                id="document-preview-title"
                className="truncate text-base font-medium text-white"
                title={document.fileName}
              >
                {document.fileName}
              </h2>
              {meta && <p className="truncate text-xs text-white/50">{meta}</p>}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {documents.length > 1 && (
                <span className="mr-2 hidden rounded-full bg-white/10 px-3 py-1 text-xs font-medium tabular-nums text-white/80 sm:inline">
                  {index + 1} / {documents.length}
                </span>
              )}
              {file.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open in new tab"
                  title="Open in new tab"
                  className={TOOL}
                >
                  <ExternalLink className="size-5" aria-hidden="true" />
                </a>
              )}
              <button
                type="button"
                disabled={!file.blob}
                onClick={() => saveBlob(file.blob, document.fileName)}
                aria-label="Download"
                title="Download"
                className={TOOL}
              >
                <Download className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                autoFocus
                onClick={onClose}
                aria-label="Close preview"
                title="Close (Esc)"
                className={TOOL}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Stage — clicking the empty area around the document closes */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-20"
            onClick={(event) => event.target === event.currentTarget && onClose()}
          >
            {hasPrev && (
              <button
                type="button"
                onClick={() => onNavigate(index - 1)}
                aria-label="Previous document"
                className={`${ARROW} left-4`}
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
            )}

            <Stage document={document} file={file} />

            {hasNext && (
              <button
                type="button"
                onClick={() => onNavigate(index + 1)}
                aria-label="Next document"
                className={`${ARROW} right-4`}
              >
                <ChevronRight className="size-6" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Filmstrip */}
          {documents.length > 1 && (
            <nav aria-label="Documents" className="flex justify-center px-4 pb-4">
              <ul className="flex max-w-full gap-2 overflow-x-auto rounded-xl bg-white/5 p-2">
                {documents.map((doc, i) => (
                  <li key={doc.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate(i)}
                      aria-label={`${labelFor(doc)}: ${doc.fileName}`}
                      aria-current={i === index ? 'true' : undefined}
                      title={labelFor(doc)}
                      className={`block size-14 overflow-hidden rounded-lg text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                        i === index
                          ? 'opacity-100 ring-2 ring-orange-500'
                          : 'opacity-50 hover:opacity-90'
                      }`}
                    >
                      <DocumentThumbnail quoteId={quoteId} document={doc} compact />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    window.document.body,
  );
}

export default DocumentPreviewDialog;
