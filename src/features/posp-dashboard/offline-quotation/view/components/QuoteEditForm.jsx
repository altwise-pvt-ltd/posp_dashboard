import { useEffect, useMemo, useRef } from "react";
import { RefreshCw, Save } from "lucide-react";
import DynamicForm from "@/shared/dynamic-form/components/DynamicForm";
import CustomButton from "@/shared/components/CustomButton";
import { showAlert } from "@/shared/store/alertStore";
import { storedDocumentFile } from "@/features/posp-dashboard/offline-quotation/api/quoteDocumentsApi";
import QuoteWizardFooter from "@/features/posp-dashboard/offline-quotation/components/QuoteWizardFooter";
import { PANEL } from '../lib/panel';
import { useQuoteDraft } from "@/features/posp-dashboard/offline-quotation/hooks/useQuoteDraft";
import { useQuoteForm } from "@/features/posp-dashboard/offline-quotation/hooks/useQuoteForm";
import { focusField } from "@/features/posp-dashboard/offline-quotation/lib/focusField";
import { buildQuoteSections } from "@/features/posp-dashboard/offline-quotation/lib/quoteSections";
import { fetchQuoteDocumentBlob, isImage } from "../api/quoteDocumentListApi";
import { storedDocumentValues, storedFormValues } from "../lib/quoteAnswers";

// Edits a draft or returned quote, seeded with its stored answers and documents.
// Saves through POST /quote/draft with quoteId in the body (see saveQuoteDraft).
function QuoteEditForm({ quote, metadata, documents, onCancel, onSaved }) {
  const baseSections = useMemo(() => buildQuoteSections(metadata), [metadata]);

  const storedDocs = useMemo(
    () => storedDocumentValues(baseSections, documents),
    [baseSections, documents],
  );

  // Stored answers override the product's preset values.
  const seeded = useMemo(
    () => ({
      ...(metadata.directives?.setValues ?? {}),
      ...storedFormValues(baseSections, quote.values),
      ...storedDocs.values,
    }),
    [metadata, baseSections, quote.values, storedDocs],
  );

  const productId = metadata.productId ?? quote.productId;
  const subProductId = metadata.subProductId ?? quote.subProductId;

  // Edit mode opens with saved answers, so the rules run on them at once.
  const form = useQuoteForm({
    metadata,
    baseSections,
    seed: seeded,
    productId,
    subProductId,
    evaluateOnMount: true,
  });
  const {
    values,
    setAllValues,
    errors,
    directives,
    sections,
    fields,
    lookups,
    checking,
    rulesError,
  } = form;

  // Swaps each stored image's name for its fetched file, for the thumbnail. Other
  // documents keep their name. The name also stays if the fetch fails or the field changed.
  useEffect(() => {
    let live = true;

    for (const doc of storedDocs.documents.filter(isImage)) {
      fetchQuoteDocumentBlob(quote.id, doc.id)
        .then((blob) => {
          if (!live) return;
          const file = storedDocumentFile(blob, doc);

          setAllValues((prev) => {
            const current = prev[doc.code];
            if (current === doc.fileName) return { ...prev, [doc.code]: file };

            const at = Array.isArray(current) ? current.indexOf(doc.fileName) : -1;
            if (at < 0) return prev;
            return {
              ...prev,
              [doc.code]: current.map((entry, i) => (i === at ? file : entry)),
            };
          });
        })
        .catch(() => {});
    }

    return () => {
      live = false;
    };
  }, [quote.id, storedDocs, setAllValues]);

  const draft = useQuoteDraft({ quoteId: quote.id, productId, subProductId });

  const busy =
    checking || draft.phase === "saving" || draft.phase === "uploading";

  // Once the save is done, show an alert and hand back to the page to reload the quote.
  // A partial save stays here so failed files can be retried.
  const leftRef = useRef(false);

  useEffect(() => {
    if (draft.phase !== "done" || leftRef.current) return;
    leftRef.current = true;

    showAlert({
      variant: "success",
      title: "Quotation updated",
      message: "Your changes are saved.",
    });

    onSaved?.();
  }, [draft.phase, onSaved]);

  const handleChange = (code, next) => {
    form.change(code, next);
    draft.reset();
    leftRef.current = false;
  };

  // Validates every visible field against the rules for the current answers.
  const handleSave = async () => {
    if (busy) return;

    const checked = await form.validateForSave();
    if (!checked) return;

    if (checked.first) {
      if (draft.phase === "error") draft.reset();
      focusField(checked.first.code);
      return;
    }

    draft.save(checked.fields, values);
  };

  const errorCount = Object.keys(errors).length;
  const failed = draft.uploads?.failed ?? [];

  const statusMessage = () => {
    if (checking) return "Checking the form…";
    if (rulesError) return rulesError;
    if (draft.phase === "saving") return "Saving your changes…";
    if (draft.phase === "uploading") {
      const { done, total } = draft.uploads;
      return `Answers saved. Uploading document ${Math.min(done + 1, total)} of ${total}…`;
    }
    if (draft.phase === "error") return draft.error;
    if (draft.phase === "partial") {
      return `Answers saved. ${failed.length} ${
        failed.length === 1 ? "document didn't" : "documents didn't"
      } upload — ${failed[0]?.message ?? ""}`;
    }
    if (draft.phase === "done") return "Changes saved.";
    if (errorCount > 0) {
      return `Fix ${errorCount} highlighted ${errorCount === 1 ? "field" : "fields"} to save.`;
    }
    return "Edit any answer, or fill in the ones left blank.";
  };

  const tone =
    rulesError ||
    errorCount > 0 ||
    draft.phase === "error" ||
    draft.phase === "partial"
      ? "error"
      : draft.phase === "done"
        ? "success"
        : "default";

  return (
    <div className="flex flex-col gap-gutter">
      {sections.map((section) => (
        <section
          key={section.code}
          className={PANEL}
        >
          <DynamicForm
            sections={[section]}
            directives={directives}
            values={values}
            errors={errors}
            onChange={handleChange}
            onBlur={form.blur}
            lookupOptions={lookups.options}
            lookupStatus={lookups.status}
            onLookupRetry={lookups.retry}
          />
        </section>
      ))}

      <QuoteWizardFooter
        message={statusMessage()}
        tone={tone}
        onBack={onCancel}
        backLabel="Cancel"
        backVariant="secondary"
        backDisabled={busy}
      >
        {draft.phase === "partial" ? (
          <CustomButton
            variant="primary"
            size="md"
            leftIcon={<RefreshCw />}
            onClick={() => draft.retryUploads(fields, values)}
          >
            Retry {failed.length === 1 ? "upload" : "uploads"}
          </CustomButton>
        ) : (
          <CustomButton
            variant="primary"
            size="md"
            loading={busy}
            leftIcon={
              draft.phase === "error" || rulesError ? <RefreshCw /> : <Save />
            }
            onClick={handleSave}
          >
            {checking
              ? "Checking"
              : draft.phase === "error"
                ? "Try again"
                : busy
                  ? "Saving"
                  : "Save changes"}
          </CustomButton>
        )}
      </QuoteWizardFooter>
    </div>
  );
}

export default QuoteEditForm;
