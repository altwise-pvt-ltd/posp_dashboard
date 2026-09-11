import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, RefreshCw, Save, ShieldAlert } from 'lucide-react';
import DynamicForm from '@/features/dynamic-form/components/DynamicForm';
import { useDynamicFormValues } from '@/features/dynamic-form/hooks/useDynamicFormValues';
import { useLookupOptions } from '@/features/dynamic-form/hooks/useLookupOptions';
import { resolveVisibleSections } from '@/features/dynamic-form/lib/visibleSections';
import {
  isFieldAnswered,
  validateField,
  validateFields,
} from '@/features/dynamic-form/lib/validateFields';
import CustomButton from '@/shared/components/CustomButton';
import { fetchLookupOptions } from '../api/quoteMetadataApi';
import { addOnValueCode, buildQuoteSections, pruneAddOnValues } from '../lib/quoteSections';
import { useQuoteDraft } from '../hooks/useQuoteDraft';
import { useQuoteRules } from '../hooks/useQuoteRules';
import QuoteSectionProgress from './QuoteSectionProgress';
import QuoteWizardFooter from './QuoteWizardFooter';

/**
 * The inspection notice is modelled as one more section that happens to have no
 * fields, so Next/Back, the progress bar and the section count need no special
 * case for the last screen. It is appended only when the product actually calls
 * for an inspection -- an empty screen should not be counted or walked through.
 *
 * Documents used to share this screen as a read-only checklist. They now arrive
 * with a `controlType` and render as file fields in a section of their own, so
 * nothing is left here but the notice.
 */
const REVIEW_CODE = '__review__';
const REVIEW_SECTION = { code: REVIEW_CODE, name: 'Before you submit', fields: [] };

const focusField = (code) => {
  const node = document.getElementById(code);
  node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  node?.focus?.({ preventScroll: true });
};

function QuoteInspection({ inspectionRequired }) {
  if (!inspectionRequired) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-orange-50/40 p-4">
      <p className="font-body-md text-body-md flex items-start gap-2 text-on-surface">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-primary" />
        This product needs a physical inspection before the policy can be issued.
      </p>
    </section>
  );
}

function QuoteFormFields({ metadata, onBack }) {
  // Documents and add-ons are sections like any other from here down, so the
  // defaults, the validation sweep and the step list all pick them up without
  // knowing where they came from.
  const baseSections = useMemo(() => buildQuoteSections(metadata), [metadata]);

  const { values, setValue } = useDynamicFormValues(baseSections, metadata.directives.setValues);

  const [errors, setErrors] = useState({});
  const [confirmingBack, setConfirmingBack] = useState(false);

  /**
   * Where the save has got to -- the draft post, then the uploads it unlocks.
   * The hook owns both because they are one action to the user: an edit
   * withdraws the confirmation for the pair, and a file that fails leaves the
   * answers saved and says so.
   */
  const draft = useQuoteDraft({
    productId: metadata.productId,
    subProductId: metadata.subProductId,
  });

  const busy = draft.phase === 'saving' || draft.phase === 'uploading';

  /**
   * The cursor is stored as a section *code*, because a rule can hide a section
   * above the current one and silently shift every index below it. The index
   * rides along only as the fallback for when that code disappears mid-form:
   * clamp the position we were at into the new, shorter list.
   */
  const [cursor, setCursor] = useState({ code: null, index: 0 });

  const rootRef = useRef(null);
  const headingRef = useRef(null);
  const enteredRef = useRef(false);

  // A field named by a failed save that lives on another section: it cannot be
  // focused until the jump has rendered, so the request waits here for the
  // section effect to pick it up.
  const pendingFocusRef = useRef(null);

  const ruleDirectives = useQuoteRules({
    productId: metadata.productId,
    subProductId: metadata.subProductId,
    values,
  });

  const directives = ruleDirectives ?? metadata.directives;

  const sections = useMemo(
    () => resolveVisibleSections(pruneAddOnValues(baseSections, values), directives),
    [baseSections, values, directives]
  );

  const fields = useMemo(() => sections.flatMap((entry) => entry.fields), [sections]);
  const fieldsByCode = useMemo(() => new Map(fields.map((field) => [field.code, field])), [fields]);

  // Lookups are prefetched for the whole form, not just the section on screen --
  // the hook dedupes by `source|parent`, so walking forward costs no requests.
  const lookupOptions = useLookupOptions(fields, values, fetchLookupOptions);

  const requiredCodes = useMemo(() => new Set(directives.requiredFields ?? []), [directives]);

  // The add-ons that carry an amount, so unticking one can take its amount with
  // it rather than leaving a figure behind for an add-on nobody chose.
  const addOnsWithValue = useMemo(
    () =>
      new Set(
        baseSections
          .flatMap((entry) => entry.fields)
          .map((field) => field.addOnFor)
          .filter(Boolean)
      ),
    [baseSections]
  );

  const needsInspection = Boolean(directives.inspectionRequired);

  const steps = useMemo(() => {
    const list = needsInspection ? [...sections, REVIEW_SECTION] : sections;
    // Rules can hide every section; never leave the form with nothing on screen.
    return list.length > 0 ? list : [REVIEW_SECTION];
  }, [sections, needsInspection]);

  const index = useMemo(() => {
    const found = steps.findIndex((entry) => entry.code === cursor.code);
    if (found >= 0) return found;
    return Math.min(Math.max(cursor.index, 0), steps.length - 1);
  }, [steps, cursor]);

  const section = steps[index];
  const isReview = section.code === REVIEW_CODE;
  const isLast = index === steps.length - 1;

  /**
   * A section may legitimately carry no name -- the API defaults it to `''` --
   * so it falls back to its position among the sections still *visible*, which
   * keeps the numbering gapless when a rule hides one above it.
   */
  const labels = useMemo(
    () =>
      steps.map((entry, position) =>
        entry.code === REVIEW_CODE ? entry.name : entry.name || `Section ${position + 1}`
      ),
    [steps]
  );

  // The heading is rendered by the progress block, which owns the focus target,
  // so the form itself is handed the section without its title.
  const formSections = useMemo(
    () => (isReview ? [] : [{ ...section, name: '' }]),
    [isReview, section]
  );

  const visibleErrors = useMemo(() => {
    const found = {};
    for (const field of section.fields) {
      if (errors[field.code]) found[field.code] = errors[field.code];
    }
    return found;
  }, [section, errors]);

  useEffect(() => {
    if (!enteredRef.current) {
      enteredRef.current = true;
      return;
    }

    // A field the user has to fix outranks the top of the section it sits in.
    const pending = pendingFocusRef.current;
    pendingFocusRef.current = null;

    if (pending) {
      focusField(pending);
      return;
    }

    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    headingRef.current?.focus?.({ preventScroll: true });
  }, [index]);

  const moveTo = (next) => {
    const clamped = Math.min(Math.max(next, 0), steps.length - 1);
    setConfirmingBack(false);
    // A failed save is about the form, not the section: it stops being the news
    // as soon as the user walks away from it. A stored draft is left alone.
    if (draft.phase === 'error') draft.reset();
    setCursor({ code: steps[clamped].code, index: clamped });
  };

  const clearError = (code) =>
    setErrors((prev) => {
      if (!prev[code]) return prev;
      const rest = { ...prev };
      delete rest[code];
      return rest;
    });

  const handleChange = (code, next) => {
    setValue(code, next);
    setConfirmingBack(false);
    clearError(code);
    draft.reset();

    if (!next && addOnsWithValue.has(code)) {
      const valueCode = addOnValueCode(code);
      setValue(valueCode, '');
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
   * Next checks the section on screen and nothing else: sweeping the whole form
   * here would mark fields red in sections the user has not reached yet. The
   * button stays tappable rather than greying out -- a disabled button cannot
   * say why it is disabled.
   */
  const handleNext = () => {
    const found = validateFields(section.fields, values, requiredCodes);

    setErrors((prev) => {
      const next = { ...prev };
      for (const field of section.fields) delete next[field.code];
      return { ...next, ...found };
    });

    const first = section.fields.find((field) => found[field.code]);
    if (first) {
      focusField(first.code);
      return;
    }

    moveTo(index + 1);
  };

  /**
   * Save still re-checks every field, not just the last section: a rule can add
   * a `requiredField` to a section the user already walked past. The first
   * offender decides which section to jump back to, and nothing is posted --
   * the server hears about the form only once it is answerable.
   */
  const handleSave = () => {
    if (busy) return;

    const found = validateFields(fields, values, requiredCodes);
    setErrors(found);

    const first = fields.find((field) => found[field.code]);

    if (first) {
      if (draft.phase === 'error') draft.reset();

      const target = steps.findIndex((entry) =>
        entry.fields.some((field) => field.code === first.code)
      );

      if (target >= 0 && target !== index) {
        pendingFocusRef.current = first.code;
        moveTo(target);
        return;
      }

      focusField(first.code);
      return;
    }

    draft.save(fields, values);
  };

  /**
   * Leaving the first section unmounts this component and destroys every
   * answer -- there is no draft to fall back on -- so it asks first. Back used
   * to be one deliberate tap at the bottom of a long page; sectioning turns it
   * into a button the user taps repeatedly.
   */
  const handleBack = () => {
    if (index > 0) {
      moveTo(index - 1);
      return;
    }

    if (!confirmingBack) {
      setConfirmingBack(true);
      return;
    }

    onBack();
  };

  const errorCount = Object.keys(visibleErrors).length;

  const uploads = draft.uploads;
  const failed = uploads?.failed ?? [];

  const discardMessage =
    metadata.documents.length > 0
      ? 'Going back to the product clears every answer and attachment on this form.'
      : 'Going back to the product clears every answer on this form.';

  /** What was stored, by the number the agent would quote for it. */
  const storedLine = () =>
    draft.draft?.reference ? `Draft saved as ${draft.draft.reference}.` : 'Draft saved.';

  const countOf = (total, noun) => `${total} ${total === 1 ? noun : `${noun}s`}`;

  const statusMessage = () => {
    if (confirmingBack) return discardMessage;
    if (draft.phase === 'saving') return 'Saving your draft…';

    if (draft.phase === 'uploading') {
      const at = Math.min(uploads.done + 1, uploads.total);
      return `${storedLine()} Uploading document ${at} of ${uploads.total}…`;
    }

    if (draft.phase === 'error') return draft.error;

    // The answers are safe and some file is not. Saying so in that order
    // matters: the user's next move is to retry an upload, not to fill the
    // form in again.
    if (draft.phase === 'partial') {
      return `${storedLine()} ${countOf(failed.length, 'document')} didn't upload — ${
        failed[0]?.message ?? ''
      }`;
    }

    if (draft.phase === 'done') {
      const sent = uploads?.done ?? 0;
      return sent > 0 ? `${storedLine()} ${countOf(sent, 'document')} uploaded.` : storedLine();
    }

    if (errorCount > 0) {
      return `Fix ${errorCount} highlighted ${errorCount === 1 ? 'field' : 'fields'} to continue.`;
    }

    if (isReview) {
      return `${fields.length} questions across ${sections.length} ${
        sections.length === 1 ? 'section' : 'sections'
      }.`;
    }

    return `${section.fields.length} ${
      section.fields.length === 1 ? 'question' : 'questions'
    } in this section.`;
  };

  const tone =
    confirmingBack || errorCount > 0 || draft.phase === 'error' || draft.phase === 'partial'
      ? 'error'
      : draft.phase === 'done'
        ? 'success'
        : 'default';

  const backLabel = confirmingBack ? 'Discard answers' : index === 0 ? 'Change product' : 'Back';

  /**
   * Four things the same button does, in the order they can happen: save, wait,
   * send the files again if some didn't make it, and finally stop being a
   * button at all. That last state matters -- once the draft on the server and
   * the form on screen are the same thing, a second press would post a second
   * copy. The first edit brings it back.
   */
  const saveButton = () => {
    if (draft.phase === 'done') {
      return (
        <CustomButton variant="secondary" size="md" leftIcon={<Check />} disabled>
          Draft saved
        </CustomButton>
      );
    }

    if (draft.phase === 'partial') {
      return (
        <CustomButton
          variant="primary"
          size="md"
          leftIcon={<RefreshCw />}
          onClick={() => draft.retryUploads(fields, values)}
        >
          Retry {failed.length === 1 ? 'upload' : 'uploads'}
        </CustomButton>
      );
    }

    const label =
      draft.phase === 'saving'
        ? 'Saving'
        : draft.phase === 'uploading'
          ? `Uploading ${Math.min(uploads.done + 1, uploads.total)} of ${uploads.total}`
          : draft.phase === 'error'
            ? 'Try again'
            : 'Save draft';

    return (
      <CustomButton
        variant="primary"
        size="md"
        loading={busy}
        leftIcon={draft.phase === 'error' ? <RefreshCw /> : <Save />}
        onClick={handleSave}
      >
        {label}
      </CustomButton>
    );
  };

  return (
    <div ref={rootRef} className="flex scroll-mt-4 flex-col gap-gutter">
      <QuoteSectionProgress
        label={labels[index]}
        current={index}
        total={steps.length}
        headingRef={headingRef}
      />

      {/* Keyed on the section so each screen fades in the way the top-level
          steps do. Only this subtree is replaced -- every answer lives in the
          component around it, which stays mounted. */}
      <div key={section.code} className="anim-fade flex flex-col gap-gutter">
        {isReview ? (
          <QuoteInspection inspectionRequired={directives.inspectionRequired} />
        ) : (
          <DynamicForm
            sections={formSections}
            directives={directives}
            values={values}
            errors={visibleErrors}
            onChange={handleChange}
            onBlur={handleBlur}
            lookupOptions={lookupOptions}
          />
        )}
      </div>

      <QuoteWizardFooter
        message={statusMessage()}
        tone={tone}
        onBack={handleBack}
        backLabel={backLabel}
        backVariant={confirmingBack ? 'danger' : 'secondary'}
        backDisabled={busy}
      >
        {confirmingBack ? (
          <CustomButton variant="secondary" size="md" onClick={() => setConfirmingBack(false)}>
            Keep editing
          </CustomButton>
        ) : isLast ? (
          saveButton()
        ) : (
          <CustomButton variant="primary" size="md" rightIcon={<ArrowRight />} onClick={handleNext}>
            Next
          </CustomButton>
        )}
      </QuoteWizardFooter>
    </div>
  );
}

export default QuoteFormFields;
