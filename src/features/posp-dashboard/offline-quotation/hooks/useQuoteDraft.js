import { useCallback, useEffect, useRef, useState } from 'react';
import { documentKey, pendingDocuments, uploadQuoteDocument } from '../api/quoteDocumentsApi';
import { saveQuoteDraft } from '../api/quoteDraftApi';

// Saves the answers to /quote/draft, then uploads documents to the returned quote id.
// `partial` means the answers are stored but some uploads failed; those can be retried alone.
const IDLE = { phase: 'idle', draft: null, error: '', uploads: null };

const message = (error, fallback) => error?.message || fallback;

export function useQuoteDraft({ quoteId = null, productId, subProductId }) {
  const [state, setState] = useState(IDLE);

  // Run token: bumped on unmount, new save and reset, so a late reply from an old run is ignored.
  const runRef = useRef(0);

  useEffect(() => {
    runRef.current += 1;
    return () => {
      runRef.current += 1;
    };
  }, []);

  // Files already uploaded, keyed by quote and file, so a re-save skips them.
  const uploadedRef = useRef(new Set());
  const draftRef = useRef(null);

  // Id from the first save; later saves send it to update that quote instead of creating another.
  const savedIdRef = useRef(null);
  const pendingRef = useRef(null);

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

    // Saved but no quote id came back, so the files have nowhere to upload.
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

    // Upload one file at a time.
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

      // Wait for an earlier save still in flight, so its quote id is known.
      if (!savedIdRef.current && pendingRef.current) {
        await pendingRef.current.catch(() => {});
        if (runRef.current !== token) return;
      }

      const id = savedIdRef.current || quoteId;

      // The id is kept even if this run is superseded by an edit.
      const request = saveQuoteDraft({ quoteId: id, productId, subProductId, fields, values }).then(
        (result) => {
          if (result.id) savedIdRef.current = result.id;
          return result;
        }
      );
      pendingRef.current = request;

      let draft;

      try {
        draft = await request;
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

      // ⚠ Unconfirmed whether an update reply includes the id; fall back to the one sent.
      if (id && !draft.id) draft = { ...draft, id };

      draftRef.current = draft;
      await runUploads(token, draft, fields, values);
    },
    [quoteId, productId, subProductId, runUploads]
  );

  // Retry the files only, against the quote already stored.
  const retryUploads = useCallback(
    async (fields, values) => {
      const draft = draftRef.current;
      if (!draft) return;

      const token = (runRef.current += 1);
      await runUploads(token, draft, fields, values);
    },
    [runUploads]
  );

  // Called on edit: cancels any run and clears the saved state; uploaded files stay recorded.
  const reset = useCallback(() => {
    runRef.current += 1;
    setState((prev) => (prev.phase === 'idle' ? prev : IDLE));
  }, []);

  return { ...state, save, retryUploads, reset };
}
