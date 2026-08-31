import { useEffect, useState } from "react";
import { fetchDocumentBlob, hasDocumentKey } from "../api/onboardingApi";

const MIME_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const fileNameFor = (key) => key.split("/").pop() || "document";

const mimeFor = (key, blob) => {
  const extension = key.split(".").pop()?.toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? blob.type;
};

/**
 * Documents already on the server, as `File`s the form can hold and re-send.
 *
 * `GET /onboarding/review` hands back document *keys*, not files, so a step
 * reopened from Review has an empty upload box for every document the applicant
 * already provided — and `fileField` then refuses the save until they pick each
 * one again. This fetches the stored bytes back and rewraps them as `File`s, so
 * an unchanged document survives an edit untouched.
 *
 * The bytes are re-sent rather than omitted because the save endpoints have no
 * "keep what's on file" mode — see `saveBankDetails` — so a field that merely
 * *looked* filled would still fail on submit.
 *
 * The MIME is taken from the key's extension in preference to the blob's own
 * type: `checkPreparedFile` gates on the type, and a server answering
 * `application/octet-stream` would otherwise fail a document it just stored.
 *
 * A fetch that fails resolves to nothing for that field, which leaves the upload
 * box empty — the same state the user would have seen anyway, and one they can
 * still act on.
 *
 * Pass `form` to have the restored files written into it. That seeding belongs
 * here rather than in each step: showing a thumbnail and satisfying the field's
 * `fileField` rule are two halves of one job, and a step that did only the first
 * would display the document it had just refused to accept. `SelfieStep` is the
 * one caller with no form — it draws the photo itself — so `form` is optional.
 */
export function useDocumentFiles(keyByField, { form } = {}) {
  const [files, setFiles] = useState({});

  const entries = Object.entries(keyByField).filter(([, key]) => hasDocumentKey(key));
  const signature = entries.map(([field, key]) => `${field}=${key}`).join("|");

  /* No reset for the empty case: `initialValues` is fixed for the life of a
     step, so the set of keys cannot shrink under a mounted form, and clearing
     synchronously here is a cascading render for a state that never happens. */
  useEffect(() => {
    if (!entries.length) return undefined;

    let live = true;

    Promise.all(
      entries.map(([field, key]) =>
        fetchDocumentBlob(key)
          .then((blob) => [field, new File([blob], fileNameFor(key), { type: mimeFor(key, blob) })])
          .catch(() => null)
      )
    ).then((resolved) => {
      if (!live) return;
      setFiles(Object.fromEntries(resolved.filter(Boolean)));
    });

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => {
    if (!form) return;
    for (const [field, file] of Object.entries(files)) {
      form.setValue(field, file);
    }
  }, [files, form]);

  return files;
}
