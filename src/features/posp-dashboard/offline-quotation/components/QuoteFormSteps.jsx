import { useMemo, useState } from 'react';
import { ArrowRight, Save } from 'lucide-react';
import DynamicForm from '@/features/dynamic-form/components/DynamicForm';
import { useDynamicFormValues } from '@/features/dynamic-form/hooks/useDynamicFormValues';
import { useLookupOptions } from '@/features/dynamic-form/hooks/useLookupOptions';
import {
  isFieldAnswered,
  validateField,
  validateFields,
} from '@/features/dynamic-form/lib/validateFields';
import CustomButton from '@/shared/components/CustomButton';
import { fetchLookupOptions } from '../api/quoteMetadataApi';
import QuoteReviewStep from './QuoteReviewStep';
import QuoteWizardFooter from './QuoteWizardFooter';

const BLANK_ERRORS = { index: -1, errors: {} };

function QuoteFormSteps({ metadata, sections, sectionIndex, onBack, onNext, onEditSection }) {
  const { values, setValue } = useDynamicFormValues(
    metadata.sections,
    metadata.directives.setValues
  );

  const [errorState, setErrorState] = useState(BLANK_ERRORS);

  const errors = errorState.index === sectionIndex ? errorState.errors : BLANK_ERRORS.errors;

  const setErrors = (update) =>
    setErrorState((prev) => {
      const current = prev.index === sectionIndex ? prev.errors : BLANK_ERRORS.errors;
      const next = typeof update === 'function' ? update(current) : update;
      return next === current ? prev : { index: sectionIndex, errors: next };
    });

  const section = sections[sectionIndex] ?? null;
  const onReview = sectionIndex >= sections.length;

  const visitedFields = useMemo(
    () => sections.slice(0, sectionIndex + 1).flatMap((entry) => entry.fields),
    [sections, sectionIndex]
  );

  const fieldsByCode = useMemo(
    () => new Map(visitedFields.map((field) => [field.code, field])),
    [visitedFields]
  );

  const lookupOptions = useLookupOptions(visitedFields, values, fetchLookupOptions);

  const requiredCodes = useMemo(
    () => new Set(metadata.directives.requiredFields ?? []),
    [metadata.directives]
  );

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
  };

  const handleBlur = (code) => {
    const field = fieldsByCode.get(code);
    if (!field || !isFieldAnswered(field, values[code])) return;

    const message = validateField(field, values[code], requiredCodes);
    if (message) setErrors((prev) => ({ ...prev, [code]: message }));
    else clearError(code);
  };

  const handleNext = () => {
    if (section) {
      const found = validateFields(section.fields, values, requiredCodes);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        return;
      }
    }
    onNext();
  };

  const errorCount = Object.keys(errors).length;

  const message =
    errorCount > 0
      ? `Fix ${errorCount} highlighted ${errorCount === 1 ? 'field' : 'fields'} to continue.`
      : onReview
        ? 'Draft saving is not wired up yet.'
        : (section?.name ?? '');

  return (
    <div className="flex flex-col gap-gutter">
      {onReview ? (
        <QuoteReviewStep
          sections={sections}
          values={values}
          lookupOptions={lookupOptions}
          documents={metadata.documents}
          inspectionRequired={metadata.directives.inspectionRequired}
          onEdit={onEditSection}
        />
      ) : (
        <DynamicForm
          sections={section ? [section] : []}
          directives={metadata.directives}
          values={values}
          errors={errors}
          onChange={handleChange}
          onBlur={handleBlur}
          lookupOptions={lookupOptions}
        />
      )}

      <QuoteWizardFooter message={message} invalid={errorCount > 0} onBack={onBack}>
        {onReview ? (
          <CustomButton variant="primary" size="md" leftIcon={<Save />} disabled>
            Save draft
          </CustomButton>
        ) : (
          <CustomButton variant="primary" size="md" rightIcon={<ArrowRight />} onClick={handleNext}>
            {sectionIndex === sections.length - 1 ? 'Review' : 'Continue'}
          </CustomButton>
        )}
      </QuoteWizardFooter>
    </div>
  );
}

export default QuoteFormSteps;
