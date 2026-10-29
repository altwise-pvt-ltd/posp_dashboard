import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, RefreshCw, Save, ShieldAlert } from 'lucide-react';
import DynamicForm from '@/shared/dynamic-form/components/DynamicForm';
import { validateFields } from '@/shared/dynamic-form/lib/validateFields';
import CustomButton from '@/shared/components/CustomButton';
import { showAlert } from '@/shared/store/alertStore';
import { focusField } from '../lib/focusField';
import { QUOTE_LIST_PATH } from '../lib/quotePaths';
import { buildQuoteSections } from '../lib/quoteSections';
import { useQuoteDraft } from '../hooks/useQuoteDraft';
import { useQuoteForm } from '../hooks/useQuoteForm';
import QuoteSectionProgress from './QuoteSectionProgress';
import QuoteWizardFooter from './QuoteWizardFooter';

// The inspection notice is a field-less last section, added only when the product needs an inspection.
const REVIEW_CODE = '__review__';
const REVIEW_SECTION = { code: REVIEW_CODE, name: 'Before you submit', fields: [] };

function QuoteInspection({ inspectionRequired }) {
  if (!inspectionRequired) return null;

  return (
    <section className="rounded-xl border border-hairline bg-orange-50/40 p-4">
      <p className="font-body-md text-body-md flex items-start gap-2 text-on-surface">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-primary" />
        This product needs a physical inspection before the policy can be issued.
      </p>
    </section>
  );
}

function QuoteFormFields({ metadata, onBack, onJump, ref }) {
  const baseSections = useMemo(() => buildQuoteSections(metadata), [metadata]);

  const form = useQuoteForm({
    metadata,
    baseSections,
    seed: metadata.directives.setValues,
    productId: metadata.productId,
    subProductId: metadata.subProductId,
  });
  const {
    values,
    errors,
    setErrors,
    directives,
    sections,
    fields,
    requiredCodes,
    lookups,
    checking,
    rulesError,
  } = form;

  // Where to go once the user confirms discarding the form: 'back' or a wizard step index.
  const [leaveTo, setLeaveTo] = useState(null);
  const confirmingBack = leaveTo !== null;
  const footerRef = useRef(null);

  // Save state: the draft post, then the document uploads that follow it.
  const draft = useQuoteDraft({
    productId: metadata.productId,
    subProductId: metadata.subProductId,
  });

  const busy = checking || draft.phase === 'saving' || draft.phase === 'uploading';

  // Lets the wizard stepper ask before leaving the form; ignored while saving.
  useImperativeHandle(
    ref,
    () => ({
      requestLeave: (step) => {
        if (busy) return;
        setLeaveTo(step);
        footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    }),
    [busy]
  );

  const navigate = useNavigate();

  // `done` can be reached twice (a retried `partial`), so this stops a second navigation.
  const leftRef = useRef(false);

  // Once fully saved, show a global alert and go to the queue. Not on `partial`:
  // the upload retry needs this screen and its draft id.
  useEffect(() => {
    if (draft.phase !== 'done' || leftRef.current) return;
    leftRef.current = true;

    const reference = draft.draft?.reference;
    const uploaded = draft.uploads?.done ?? 0;

    showAlert({
      variant: 'success',
      title: reference ? `Quotation ${reference} saved` : 'Quotation saved',
      message:
        uploaded > 0
          ? `Your answers and ${uploaded} ${uploaded === 1 ? 'document' : 'documents'} are stored. It's in your quotations now.`
          : "Your answers are stored. It's in your quotations now.",
    });

    navigate(QUOTE_LIST_PATH);
  }, [draft.phase, draft.draft, draft.uploads, navigate]);

  // Cursor is stored by section code, since rules can hide sections and shift indexes.
  // The index is a fallback, clamped, if that section disappears.
  // `moved` is set once the user changes section; only then does the section fade in.
  const [cursor, setCursor] = useState({ code: null, index: 0, moved: false });

  const rootRef = useRef(null);
  const headingRef = useRef(null);
  const enteredRef = useRef(false);

  // Field to focus after jumping to another section, picked up once it renders.
  const pendingFocusRef = useRef(null);

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

  // Unnamed sections fall back to their position among the visible ones.
  const labels = useMemo(
    () =>
      steps.map((entry, position) =>
        entry.code === REVIEW_CODE ? entry.name : entry.name || `Section ${position + 1}`
      ),
    [steps]
  );

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

    // Focus a pending error field if there is one, otherwise the section heading.
    const pending = pendingFocusRef.current;
    pendingFocusRef.current = null;

    if (pending) {
      focusField(pending);
      return;
    }

    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    headingRef.current?.focus?.({ preventScroll: true });
  }, [index]);

  // Save passes its freshly checked sections as `list`; they may not have rendered yet.
  const moveTo = (next, list = steps) => {
    const clamped = Math.min(Math.max(next, 0), list.length - 1);
    setLeaveTo(null);
    form.clearRulesError();
    // Clear a failed save on navigation; a stored draft is kept.
    if (draft.phase === 'error') draft.reset();
    setCursor({ code: list[clamped].code, index: clamped, moved: true });
  };

  const handleChange = (code, next) => {
    form.change(code, next);
    setLeaveTo(null);
    draft.reset();
  };

  // Validates only the current section before moving on.
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

  // Waits for rules on the latest answers, then validates every section, since rules
  // can make earlier fields required. Jumps to the first error instead of posting.
  const handleSave = async () => {
    if (busy) return;

    const checked = await form.validateForSave();
    if (!checked) return;

    const { first } = checked;

    if (first) {
      if (draft.phase === 'error') draft.reset();

      const target = checked.sections.findIndex((entry) =>
        entry.fields.some((field) => field.code === first.code)
      );

      if (target >= 0 && target !== index) {
        pendingFocusRef.current = first.code;
        moveTo(target, checked.sections);
        return;
      }

      focusField(first.code);
      return;
    }

    draft.save(checked.fields, values);
  };

  // Leaving discards the answers, so the first press asks and the second leaves.
  const handleBack = () => {
    if (confirmingBack) {
      if (leaveTo === 'back') onBack();
      else onJump(leaveTo);
      return;
    }

    if (index > 0) {
      moveTo(index - 1);
      return;
    }

    setLeaveTo('back');
  };

  const errorCount = Object.keys(visibleErrors).length;

  const uploads = draft.uploads;
  const failed = uploads?.failed ?? [];

  const discardMessage =
    metadata.documents.length > 0
      ? 'Leaving this form clears every answer and attachment on it.'
      : 'Leaving this form clears every answer on it.';

  const storedLine = () =>
    draft.draft?.reference ? `Draft saved as ${draft.draft.reference}.` : 'Draft saved.';

  const countOf = (total, noun) => `${total} ${total === 1 ? noun : `${noun}s`}`;

  const statusMessage = () => {
    if (confirmingBack) return discardMessage;
    if (checking) return 'Checking the form…';
    if (rulesError) return rulesError;
    if (draft.phase === 'saving') return 'Saving your draft…';

    if (draft.phase === 'uploading') {
      const at = Math.min(uploads.done + 1, uploads.total);
      return `${storedLine()} Uploading document ${at} of ${uploads.total}…`;
    }

    if (draft.phase === 'error') return draft.error;

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
    confirmingBack ||
    rulesError ||
    errorCount > 0 ||
    draft.phase === 'error' ||
    draft.phase === 'partial'
      ? 'error'
      : draft.phase === 'done'
        ? 'success'
        : 'default';

  const backLabel = confirmingBack ? 'Discard answers' : index === 0 ? 'Change product' : 'Back';

  // Disabled once saved so a second press can't post a duplicate draft; any edit re-enables it.
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

    const label = checking
      ? 'Checking'
      : draft.phase === 'saving'
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
        leftIcon={draft.phase === 'error' || rulesError ? <RefreshCw /> : <Save />}
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

      <div
        key={section.code}
        className={`${cursor.moved ? 'anim-fade ' : ''}flex flex-col gap-gutter`}
      >
        {isReview ? (
          <QuoteInspection inspectionRequired={directives.inspectionRequired} />
        ) : (
          <DynamicForm
            sections={formSections}
            directives={directives}
            values={values}
            errors={visibleErrors}
            onChange={handleChange}
            onBlur={form.blur}
            lookupOptions={lookups.options}
            lookupStatus={lookups.status}
            onLookupRetry={lookups.retry}
          />
        )}
      </div>

      <QuoteWizardFooter
        ref={footerRef}
        message={statusMessage()}
        tone={tone}
        onBack={handleBack}
        backLabel={backLabel}
        backVariant={confirmingBack ? 'danger' : 'secondary'}
        backDisabled={busy}
      >
        {confirmingBack ? (
          <CustomButton variant="secondary" size="md" onClick={() => setLeaveTo(null)}>
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
