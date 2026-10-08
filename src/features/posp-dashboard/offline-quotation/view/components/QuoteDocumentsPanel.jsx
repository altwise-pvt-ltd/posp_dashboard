import { useCallback, useMemo, useState } from 'react';
import { Eye, FolderOpen, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import QuoteNotice from '../../components/QuoteNotice';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import DocumentThumbnail from './DocumentThumbnail';
import { formatBytes, readableCode } from '../api/quoteDocumentListApi';
import { formatDate } from '../lib/quotationFormat';

/** `claim.png` → "PNG"; falls back to the content type's subtype. */
const extension = (doc) =>
  (/\.([a-z0-9]+)$/i.exec(doc.fileName)?.[1] ?? doc.contentType.split('/')[1] ?? 'file').toUpperCase();

/** Every document stored on the quote, each opening a full preview. */
function QuoteDocumentsPanel({ quoteId, documents, loading, error, onRetry, metadata }) {
  const [openIndex, setOpenIndex] = useState(null);

  const names = useMemo(
    () => new Map((metadata?.documents ?? []).map((doc) => [doc.code, doc.name])),
    [metadata],
  );

  const labelFor = useCallback(
    (doc) => names.get(doc.code) || readableCode(doc.code),
    [names],
  );

  const close = useCallback(() => setOpenIndex(null), []);

  return (
    <section className="anim-fade-d2 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
      <h3 className="font-headline-md text-headline-md text-on-surface">Documents</h3>

      {loading && documents.length === 0 ? (
        <div className="font-body-md text-body-md mt-4 flex items-center gap-2 text-on-surface-variant">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading documents
        </div>
      ) : error ? (
        <QuoteNotice
          icon={<TriangleAlert size={20} />}
          title="Couldn't load the documents"
          body={error?.message || 'Please try again.'}
          action={
            <CustomButton variant="secondary" size="md" leftIcon={<RefreshCw />} onClick={onRetry} className="mt-2">
              Try again
            </CustomButton>
          }
        />
      ) : documents.length === 0 ? (
        <QuoteNotice
          icon={<FolderOpen size={20} />}
          title="No documents"
          body="Nothing has been uploaded on this quote yet."
        />
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {documents.map((doc, index) => (
            <li key={doc.id} className="min-w-0">
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`Preview ${labelFor(doc)}: ${doc.fileName}`}
                className="group flex w-full flex-col overflow-hidden rounded-lg border border-hairline bg-white text-left transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 motion-reduce:hover:translate-y-0"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden bg-well text-on-surface-variant">
                  <DocumentThumbnail quoteId={quoteId} document={doc} />

                  <span className="absolute left-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-field-label font-semibold uppercase tracking-wide text-on-surface-variant shadow-sm">
                    {extension(doc)}
                  </span>

                  <span className="absolute inset-0 hidden items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/25 sm:flex">
                    <span className="inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-on-surface opacity-0 shadow-sm transition group-hover:translate-y-0 group-hover:opacity-100">
                      <Eye className="size-3.5" aria-hidden="true" />
                      Preview
                    </span>
                  </span>
                </div>

                <div className="min-w-0 border-t border-hairline-soft px-2.5 py-2 sm:px-3">
                  <p className="font-label-caps text-label-caps truncate font-semibold uppercase text-on-surface-variant">
                    {labelFor(doc)}
                  </p>
                  <p className="truncate text-sm text-on-surface sm:text-base" title={doc.fileName}>
                    {doc.fileName}
                  </p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {[formatBytes(doc.sizeBytes), doc.uploadedAt && formatDate(doc.uploadedAt)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <DocumentPreviewDialog
        quoteId={quoteId}
        documents={documents}
        index={openIndex}
        labelFor={labelFor}
        onClose={close}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}

export default QuoteDocumentsPanel;
