import { useCallback, useMemo, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Inbox, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import QuoteNotice from '../../components/QuoteNotice';
import { useRankedResponses } from '../hooks/useRankedResponses';
import { quoteDocumentLabel } from '../lib/insurerResponse';
import { docFromPath } from '../api/quoteDocumentListApi';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import InsurerResponseCard from './InsurerResponseCard';
import ResponseSortSelect from './ResponseSortSelect';
import { PANEL, PANEL_TITLE } from '../lib/panel';

/**
 * What the insurers answered — `GET /quote/<id>/compare` — as a sortable
 * comparison list, one row per response. Only mounted on a quote whose status
 * says responses exist (see `useQuoteResponses`).
 */

const noop = () => {};

function InsurerResponsePanel({
  quoteId,
  responses = [],
  loading,
  error,
  onRetry,
  onSelect,
  selectingId,
}) {
  /** True while any selection is in flight. */
  const busy = Boolean(selectingId);

  const { sortKey, setSortKey, rows, anySelected } = useRankedResponses(responses);
  const ready = !loading && !error && responses.length > 0;

  /** The quote document open in the preview: `{ document, label }` or null. */
  const [preview, setPreview] = useState(null);
  const closePreview = useCallback(() => setPreview(null), []);
  // The dialog calls this with a document; only one is ever previewed here, so the
  // argument is ignored and the label comes from the response that opened it.
  const labelFor = useCallback(() => preview?.label ?? 'Insurer quote', [preview]);
  const previewDocuments = useMemo(() => (preview ? [preview.document] : []), [preview]);

  const retryButton = (label) => (
    <CustomButton
      variant="secondary"
      size="md"
      leftIcon={<RefreshCw />}
      onClick={onRetry}
      className="mt-2"
    >
      {label}
    </CustomButton>
  );

  return (
    <section className={PANEL}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className={PANEL_TITLE}>Insurer responses</h3>
            {ready && (
              <span className="font-body-md text-body-md text-on-surface-variant">
                {responses.length} received
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md mt-0.5 text-on-surface-variant">
            What came back from the insurers this quote was sent to.
          </p>
        </div>

        {ready && responses.length > 1 && <ResponseSortSelect value={sortKey} onChange={setSortKey} />}
      </div>

      {loading ? (
        <QuoteNotice
          icon={<Loader2 size={20} className="animate-spin" />}
          title="Loading responses"
          body="Fetching what the insurers have sent back."
        />
      ) : error ? (
        <QuoteNotice
          icon={<TriangleAlert size={20} />}
          title="Couldn't load the responses"
          body={error?.message || 'The responses could not be fetched. Please try again.'}
          action={retryButton('Try again')}
        />
      ) : responses.length === 0 ? (
        // The status says a response exists, so an empty list is most likely a lag.
        <QuoteNotice
          icon={<Inbox size={20} />}
          title="Nothing to show yet"
          body="This quote is marked as having a response, but none has come through to this screen. Try again shortly."
          action={retryButton('Check again')}
        />
      ) : (
        // Movement drops to fades for users who ask the OS for reduced motion.
        <MotionConfig reducedMotion="user">
          <ul className="mt-4 flex flex-col gap-3">
            {rows.map((row, index) => {
              const { response } = row;

              return (
                <InsurerResponseCard
                  key={response.key}
                  row={row}
                  index={index}
                  dimmed={anySelected && !response.isSelected}
                  onView={() =>
                    setPreview({
                      document: docFromPath(response.quoteDocPath),
                      label: quoteDocumentLabel(response),
                    })
                  }
                  onSelect={onSelect}
                  selecting={Boolean(response.responseId) && response.responseId === selectingId}
                  busy={busy}
                />
              );
            })}
          </ul>
        </MotionConfig>
      )}

      <DocumentPreviewDialog
        quoteId={quoteId}
        documents={previewDocuments}
        index={preview ? 0 : null}
        labelFor={labelFor}
        onClose={closePreview}
        onNavigate={noop}
      />
    </section>
  );
}

export default InsurerResponsePanel;
