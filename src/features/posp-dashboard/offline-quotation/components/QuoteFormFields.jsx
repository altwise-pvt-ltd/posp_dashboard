import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, FileText, Save, ShieldAlert } from 'lucide-react';
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
import { useQuoteRules } from '../hooks/useQuoteRules';
import QuoteSectionProgress from './QuoteSectionProgress';
import QuoteWizardFooter from './QuoteWizardFooter';

/**
 * The requirements screen is modelled as one more section that happens to have
 * no fields, so Next/Back, the progress bar and the section count need no
 * special case for the last screen. It is appended only when there is something
 * on it -- `QuoteRequirements` renders nothing without documents or an
 * inspection, and an empty screen should not be counted or walked through.
 */
const REVIEW_CODE = '__review__';
const REVIEW_SECTION = { code: REVIEW_CODE, name: 'Before you submit', fields: [] };

const focusField = (code) => {
  const node = document.getElementById(code);
  node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  node?.focus?.({ preventScroll: true });
};

function QuoteRequirements({ documents, inspectionRequired }) {
  if (documents.length === 0 && !inspectionRequired) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-orange-50/40 p-4">
      {inspectionRequired && (
        <p className="font-body-md text-body-md mb-gutter flex items-start gap-2 text-on-surface">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-primary" />
          This product needs a physical inspection before the policy can be issued.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {documents.map((doc) => (
          <li
            key={doc.code}
            className="font-body-md text-body-md flex items-start gap-2 text-on-surface-variant"
          >
            <FileText size={16} className="mt-0.5 shrink-0 text-primary" />
            <span>
              {doc.name}
              {doc.required && <span className="ml-0.5 text-orange-500">*</span>}
              {doc.allowedExtensions ? ` — ${doc.allowedExtensions}` : ''}
              {doc.maxSizeMb ? ` (max ${doc.maxSizeMb} MB)` : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuoteFormFields({ metadata, onBack }) {
  const { values, setValue } = useDynamicFormValues(
    metadata.sections,
    metadata.directives.setValues
  );

  const [errors, setErrors] = useState({});
  const [checked, setChecked] = useState(false);
  const [confirmingBack, setConfirmingBack] = useState(false);

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
    () => resolveVisibleSections(metadata.sections, directives),
    [metadata.sections, directives]
  );

  const fields = useMemo(() => sections.flatMap((entry) => entry.fields), [sections]);
  const fieldsByCode = useMemo(() => new Map(fields.map((field) => [field.code, field])), [fields]);

  // Lookups are prefetched for the whole form, not just the section on screen --
  // the hook dedupes by `source|parent`, so walking forward costs no requests.
  const lookupOptions = useLookupOptions(fields, values, fetchLookupOptions);

  const requiredCodes = useMemo(() => new Set(directives.requiredFields ?? []), [directives]);

  const hasRequirements = metadata.documents.length > 0 || Boolean(directives.inspectionRequired);

  const steps = useMemo(() => {
    const list = hasRequirements ? [...sections, REVIEW_SECTION] : sections;
    // Rules can hide every section; never leave the form with nothing on screen.
    return list.length > 0 ? list : [REVIEW_SECTION];
  }, [sections, hasRequirements]);

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
    setChecked(false);
    setConfirmingBack(false);
    clearError(code);
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
   * offender decides which section to jump back to.
   */
  const handleSave = () => {
    const found = validateFields(fields, values, requiredCodes);
    setErrors(found);
    setChecked(true);

    const first = fields.find((field) => found[field.code]);
    if (!first) return;

    const target = steps.findIndex((entry) =>
      entry.fields.some((field) => field.code === first.code)
    );

    if (target >= 0 && target !== index) {
      pendingFocusRef.current = first.code;
      moveTo(target);
      return;
    }

    focusField(first.code);
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

  const message = confirmingBack
    ? 'Going back to the product clears every answer on this form.'
    : errorCount > 0
      ? `Fix ${errorCount} highlighted ${errorCount === 1 ? 'field' : 'fields'} to continue.`
      : checked && isLast
        ? 'All answers look good. Draft saving is not wired up yet.'
        : isReview
          ? `${fields.length} questions across ${sections.length} ${
              sections.length === 1 ? 'section' : 'sections'
            }.`
          : `${section.fields.length} ${
              section.fields.length === 1 ? 'question' : 'questions'
            } in this section.`;

  const backLabel = confirmingBack ? 'Discard answers' : index === 0 ? 'Change product' : 'Back';

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
          <QuoteRequirements
            documents={metadata.documents}
            inspectionRequired={directives.inspectionRequired}
          />
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
        message={message}
        invalid={confirmingBack || errorCount > 0}
        onBack={handleBack}
        backLabel={backLabel}
        backVariant={confirmingBack ? 'danger' : 'secondary'}
      >
        {confirmingBack ? (
          <CustomButton variant="secondary" size="md" onClick={() => setConfirmingBack(false)}>
            Keep editing
          </CustomButton>
        ) : isLast ? (
          <CustomButton variant="primary" size="md" leftIcon={<Save />} onClick={handleSave}>
            Save draft
          </CustomButton>
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
