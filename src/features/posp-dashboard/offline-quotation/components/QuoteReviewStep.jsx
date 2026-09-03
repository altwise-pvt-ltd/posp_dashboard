import { FileText, Pencil, TriangleAlert } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import { isValuelessControl } from '@/features/dynamic-form/components/fields/registry';

const optionText = (options, value) =>
  options?.find((entry) => String(entry.value) === String(value))?.text ?? String(value);

function displayValue(field, value, lookupOptions) {
  const options = field.lookupSource
    ? (lookupOptions?.[field.code] ?? field.options)
    : field.options;

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((entry) => optionText(options, entry)).join(', ') : '';
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'object') return value.name ?? 'Uploaded';
  if (options?.length > 0) return optionText(options, value);

  return String(value);
}

function QuoteReviewStep({
  sections,
  values,
  lookupOptions,
  documents = [],
  inspectionRequired = false,
  onEdit,
}) {
  const requiredDocuments = documents.filter((entry) => entry.required);

  return (
    <div className="flex flex-col gap-gutter">
      {sections.map((section, index) => (
        <section key={section.code}>
          <div className="mb-unit flex items-center justify-between gap-unit">
            <h3 className="font-headline-md text-headline-md min-w-0 truncate text-on-surface">
              {section.name || `Section ${index + 1}`}
            </h3>
            <CustomButton
              variant="ghost"
              size="sm"
              leftIcon={<Pencil />}
              onClick={() => onEdit(index)}
            >
              Edit
            </CustomButton>
          </div>

          <dl className="grid gap-gutter rounded-xl bg-slate-50 p-gutter sm:grid-cols-2">
            {section.fields
              .filter((field) => !isValuelessControl(field.control))
              .map((field) => {
                const text = displayValue(field, values[field.code], lookupOptions);

                return (
                  <div key={field.code} className="flex min-w-0 flex-col gap-0.5">
                    <dt className="truncate text-[0.6875rem] font-medium text-slate-400">
                      {field.label}
                    </dt>
                    <dd
                      className={`truncate text-[0.8125rem] sm:text-sm ${
                        text ? 'font-medium text-slate-900' : 'text-slate-300'
                      }`}
                    >
                      {text || '—'}
                    </dd>
                  </div>
                );
              })}
          </dl>
        </section>
      ))}

      {requiredDocuments.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-gray-200 p-gutter">
          <FileText size={16} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-semibold text-slate-700 sm:text-sm">
              Documents needed at submission
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {requiredDocuments.map((doc) => doc.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {inspectionRequired && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-gutter">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="font-body-md text-body-md text-amber-800">
            This quote will require a physical inspection.
          </p>
        </div>
      )}
    </div>
  );
}

export default QuoteReviewStep;
