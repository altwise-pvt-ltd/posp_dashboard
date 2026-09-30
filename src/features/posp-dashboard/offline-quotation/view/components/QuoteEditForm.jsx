import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import DynamicForm from "@/features/dynamic-form/components/DynamicForm";
import { useDynamicFormValues } from "@/features/dynamic-form/hooks/useDynamicFormValues";
import { useLookupState } from "@/features/dynamic-form/hooks/useLookupOptions";
import { resolveVisibleSections } from "@/features/dynamic-form/lib/visibleSections";
import {
  isFieldAnswered,
  validateField,
  validateFields,
} from "@/features/dynamic-form/lib/validateFields";
import CustomButton from "@/shared/components/CustomButton";
import { showAlert } from "@/shared/store/alertStore";
import { fetchLookupOptions } from "../../api/quoteMetadataApi";
import QuoteWizardFooter from "../../components/QuoteWizardFooter";
import { useQuoteDraft } from "../../hooks/useQuoteDraft";
import { useQuoteRules } from "../../hooks/useQuoteRules";
import {
  addOnValueCode,
  buildQuoteSections,
  pruneAddOnValues,
} from "../../lib/quoteSections";
import { storedFormValues } from "../lib/quoteAnswers";

const focusField = (code) => {
  const node = document.getElementById(code);
  node?.scrollIntoView({ behavior: "smooth", block: "center" });
  node?.focus?.({ preventScroll: true });
};

/**
 * A returned quote, reopened for correction.
 *
 * The create wizard's form — same renderers, rules, lookups and validation —
 * but every section on one page rather than one per screen. The agent is here
 * to fix what the reviewer pointed at, and walking eight screens to find the
 * one field in question is the wrong shape for that.
 *
 * Every question the product asks is shown, answered or not, seeded with what
 * the quote holds; a blank one can be filled in here like any other.
 *
 * Saved through the same `POST /quote/draft` a new quote uses, with `quoteId`
 * added to the body so the server updates this quote rather than raising a new
 * one (see `saveQuoteDraft`).
 */
function QuoteEditForm({ quote, metadata, onCancel, onSaved }) {
  const baseSections = useMemo(() => buildQuoteSections(metadata), [metadata]);

  // What the quote holds wins over the product's own defaults and presets —
  // this is the agent's answer, not the form's suggestion.
  const seeded = useMemo(
    () => ({
      ...(metadata.directives?.setValues ?? {}),
      ...storedFormValues(baseSections, quote.values),
    }),
    [metadata, baseSections, quote.values],
  );

  const { values, setValue } = useDynamicFormValues(baseSections, seeded);
  const [errors, setErrors] = useState({});

  const draft = useQuoteDraft({
    quoteId: quote.id,
    productId: metadata.productId ?? quote.productId,
    subProductId: metadata.subProductId ?? quote.subProductId,
  });

  const busy = draft.phase === "saving" || draft.phase === "uploading";

  const ruleDirectives = useQuoteRules({
    productId: metadata.productId ?? quote.productId,
    subProductId: metadata.subProductId ?? quote.subProductId,
    values,
  });

  const directives = ruleDirectives ?? metadata.directives;

  const sections = useMemo(
    () =>
      resolveVisibleSections(
        pruneAddOnValues(baseSections, values),
        directives,
      ),
    [baseSections, values, directives],
  );

  const fields = useMemo(
    () => sections.flatMap((entry) => entry.fields),
    [sections],
  );
  const fieldsByCode = useMemo(
    () => new Map(fields.map((field) => [field.code, field])),
    [fields],
  );

  const lookups = useLookupState(fields, values, fetchLookupOptions);

  const requiredCodes = useMemo(
    () => new Set(directives?.requiredFields ?? []),
    [directives],
  );

  const addOnsWithValue = useMemo(
    () =>
      new Set(
        baseSections
          .flatMap((entry) => entry.fields)
          .map((field) => field.addOnFor)
          .filter(Boolean),
      ),
    [baseSections],
  );

  /**
   * Once, on the save landing: tell the agent, then hand back to the page so it
   * re-reads the quote. `partial` stays here — the retry for the files that
   * didn't make it is on this form.
   */
  const leftRef = useRef(false);

  useEffect(() => {
    if (draft.phase !== "done" || leftRef.current) return;
    leftRef.current = true;

    showAlert({
      variant: "success",
      title: "Quotation updated",
      message: "Your corrections are saved.",
    });

    onSaved?.();
  }, [draft.phase, onSaved]);

  const clearError = (code) =>
    setErrors((prev) => {
      if (!prev[code]) return prev;
      const rest = { ...prev };
      delete rest[code];
      return rest;
    });

  const handleChange = (code, next) => {
    setValue(code, next);
    clearError(code);
    draft.reset();
    leftRef.current = false;

    if (!next && addOnsWithValue.has(code)) {
      const valueCode = addOnValueCode(code);
      setValue(valueCode, "");
      clearError(valueCode);
    }
  };

  const handleBlur = (code) => {
    const field = fieldsByCode.get(code);
    if (!field || !isFieldAnswered(field, values[code])) return;

    const message = validateField(field, values[code], requiredCodes);
    if (message) setErrors((prev) => ({ ...prev, [code]: message }));
    else clearError(code);
  };

  /**
   * Every visible field is checked, as the wizard's save does — with one
   * exception. A document already uploaded to this quote isn't in `values`
   * (there is no file to put back into the picker), so a required upload would
   * read as missing when it isn't. A file field is only checked when the agent
   * has picked a new one.
   */
  const handleSave = () => {
    if (busy) return;

    const checked = fields.filter(
      (field) =>
        field.control !== "file" || isFieldAnswered(field, values[field.code]),
    );

    const found = validateFields(checked, values, requiredCodes);
    setErrors(found);

    const first = checked.find((field) => found[field.code]);
    if (first) {
      if (draft.phase === "error") draft.reset();
      focusField(first.code);
      return;
    }

    draft.save(fields, values);
  };

  const errorCount = Object.keys(errors).length;
  const failed = draft.uploads?.failed ?? [];

  const statusMessage = () => {
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
    errorCount > 0 || draft.phase === "error" || draft.phase === "partial"
      ? "error"
      : draft.phase === "done"
        ? "success"
        : "default";

  return (
    <div className="flex flex-col gap-gutter">
      {sections.map((section) => (
        <section
          key={section.code}
          className="anim-fade-d2 rounded-xl border border-hairline bg-white p-4 sm:p-gutter"
        >
          <DynamicForm
            sections={[section]}
            directives={directives}
            values={values}
            errors={errors}
            onChange={handleChange}
            onBlur={handleBlur}
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
            leftIcon={draft.phase === "error" ? <RefreshCw /> : <Save />}
            onClick={handleSave}
          >
            {draft.phase === "error"
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
