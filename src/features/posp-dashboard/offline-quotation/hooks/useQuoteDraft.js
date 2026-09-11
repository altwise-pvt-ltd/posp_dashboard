import { useCallback, useEffect, useRef, useState } from 'react';
import { documentKey, pendingDocuments, uploadQuoteDocument } from '../api/quoteDocumentsApi';
import { saveQuoteDraft } from '../api/quoteDraftApi';

/**
 * Saving a quote is two calls, not one: the answers go to `/quote/draft`, and
 * only the uuid that comes back can address `/quote/<id>/documents`. So the
 * files cannot be sent in parallel with the draft — they are sent after it, and
 * a draft that fails takes the uploads with it.
 *
 * The phases below are what the footer and the button read. `partial` is the
 * one worth naming: the answers are stored and some file is not, which is
 * neither a success to celebrate nor a failure to re-save over. It offers to
 * retry the uploads alone, against the quote that already exists.
 */
const IDLE = { phase: 'idle', draft: null, error: '', uploads: null };

const message = (error, fallback) => error?.message || fallback;

export function useQuoteDraft({ productId, subProductId }) {
  const [state, setState] = useState(IDLE);

  /**
   * One token for both questions a late reply has to answer: has this component
   * gone, and has the run it belongs to been superseded? Every settle checks it,
   * and `reset` bumps it — so an edit made mid-flight retires the save in
   * progress instead of letting it report success over answers the server never
   * saw.
   */
  const runRef = useRef(0);

  useEffect(() => {
    runRef.current += 1;
    return () => {
      runRef.current += 1;
    };
  }, []);

  // Files already accepted, keyed by quote *and* file, so a second save doesn't
  // upload the same bytes again while a new quote still gets its own copies.
  const uploadedRef = useRef(new Set());
  const draftRef = useRef(null);

  const runUploads = useCallback(async (token, draft, fields, values) => {
    const settle = (next) => {
      if (runRef.current !== token) return false;
      setState(next);
      return true;
    };

    const queue = pendingDocuments(fields, values).filter(
      (entry) => !uploadedRef.current.has(documentKey(draft.id, entry))
    );

    if (queue.length === 0) {
      settle({ phase: 'done', draft, error: '', uploads: null });
      return;
    }

    // Nothing to address the upload to. The answers are stored, so this is not
    // a failed save -- it is a saved quote whose files have nowhere to go.
    if (!draft.id) {
      settle({
        phase: 'partial',
        draft,
        error: '',
        uploads: {
          total: queue.length,
          done: 0,
          failed: queue.map((entry) => ({
            ...entry,
            message: 'The saved draft came back without a quote id to upload against.',
          })),
        },
      });
      return;
    }

    const failed = [];
    let done = 0;

    if (
      !settle({
        phase: 'uploading',
        draft,
        error: '',
        uploads: { total: queue.length, done, failed },
      })
    ) {
      return;
    }

    // One at a time: a counter that says "2 of 3" has to mean it, and a stack of
    // parallel uploads on a phone connection is how the last one times out.
    for (const entry of queue) {
      try {
        await uploadQuoteDocument({ quoteId: draft.id, code: entry.code, file: entry.file });
        uploadedRef.current.add(documentKey(draft.id, entry));
        done += 1;
      } catch (error) {
        failed.push({ ...entry, message: message(error, 'The upload failed.') });
      }

      if (
        !settle({
          phase: 'uploading',
          draft,
          error: '',
          uploads: { total: queue.length, done, failed: [...failed] },
        })
      ) {
        return;
      }
    }

    settle({
      phase: failed.length > 0 ? 'partial' : 'done',
      draft,
      error: '',
      uploads: { total: queue.length, done, failed },
    });
  }, []);

  const save = useCallback(
    async (fields, values) => {
      const token = (runRef.current += 1);

      setState({ phase: 'saving', draft: null, error: '', uploads: null });

      let draft;

      try {
        draft = await saveQuoteDraft({ productId, subProductId, fields, values });
      } catch (error) {
        if (runRef.current === token) {
          setState({
            phase: 'error',
            draft: null,
            error: message(error, "The draft couldn't be saved. Please try again."),
            uploads: null,
          });
        }
        return;
      }

      if (runRef.current !== token) return;

      draftRef.current = draft;
      await runUploads(token, draft, fields, values);
    },
    [productId, subProductId, runUploads]
  );

  /**
   * Retry the files only, against the quote already stored. The answers are not
   * re-posted: they are saved, and a second POST to `/quote/draft` may well open
   * a second quote rather than update the first.
   */
  const retryUploads = useCallback(
    async (fields, values) => {
      const draft = draftRef.current;
      if (!draft) return;

      const token = (runRef.current += 1);
      await runUploads(token, draft, fields, values);
    },
    [runUploads]
  );

  /**
   * The form has changed, so whatever is on screen is no longer what was saved.
   * The stored draft stays on the server and `uploadedRef` keeps its record of
   * what reached it -- only the claim being made to the user is withdrawn.
   */
  const reset = useCallback(() => {
    runRef.current += 1;
    setState((prev) => (prev.phase === 'idle' ? prev : IDLE));
  }, []);

  return { ...state, save, retryUploads, reset };
}
