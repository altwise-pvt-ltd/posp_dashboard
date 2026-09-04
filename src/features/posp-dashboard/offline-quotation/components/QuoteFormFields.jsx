import { useMemo, useState } from 'react';
import { FileText, Save, ShieldAlert } from 'lucide-react';
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
import QuoteWizardFooter from './QuoteWizardFooter';

function QuoteRequirements({ documents, inspectionRequired }) {
  if (documents.length === 0 && !inspectionRequired) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-orange-50/40 p-4">
      <h3 className="font-headline-md text-headline-md mb-gutter text-on-surface">
        Before you submit
      </h3>

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

  const lookupOptions = useLookupOptions(fields, values, fetchLookupOptions);

  const requiredCodes = useMemo(
    () => new Set(directives.requiredFields ?? []),
    [directives]
  );

  const visibleErrors = useMemo(() => {
    const found = {};
    for (const field of fields) {
      if (errors[field.code]) found[field.code] = errors[field.code];
    }
    return found;
  }, [fields, errors]);

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
    clearError(code);
  };

  const handleBlur = (code) => {
    const field = fieldsByCode.get(code);
    if (!field || !isFieldAnswered(field, values[code])) return;

    const message = validateField(field, values[code], requiredCodes);
    if (message) setErrors((prev) => ({ ...prev, [code]: message }));
    else clearError(code);
  };

  const handleSave = () => {
    const found = validateFields(fields, values, requiredCodes);
    setErrors(found);
    setChecked(true);

    const first = fields.find((field) => found[field.code]);
    if (!first) return;

    const node = document.getElementById(first.code);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node?.focus?.({ preventScroll: true });
  };

  const errorCount = Object.keys(visibleErrors).length;

  const message =
    errorCount > 0
      ? `Fix ${errorCount} highlighted ${errorCount === 1 ? 'field' : 'fields'} to continue.`
      : checked
        ? 'All answers look good. Draft saving is not wired up yet.'
        : `${fields.length} questions across ${sections.length} ${
            sections.length === 1 ? 'section' : 'sections'
          }.`;

  return (
    <div className="flex flex-col gap-gutter">
      <DynamicForm
        sections={sections}
        directives={directives}
        values={values}
        errors={visibleErrors}
        onChange={handleChange}
        onBlur={handleBlur}
        lookupOptions={lookupOptions}
      />

      <QuoteRequirements
        documents={metadata.documents}
        inspectionRequired={directives.inspectionRequired}
      />

      <QuoteWizardFooter message={message} invalid={errorCount > 0} onBack={onBack}>
        <CustomButton variant="primary" size="md" leftIcon={<Save />} onClick={handleSave}>
          Save draft
        </CustomButton>
      </QuoteWizardFooter>
    </div>
  );
}

export default QuoteFormFields;
