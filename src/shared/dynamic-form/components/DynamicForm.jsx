import { useMemo } from 'react';
import { getFieldComponent, isValuelessControl } from './fields/registry';
import { resolveVisibleSections } from '../lib/visibleSections';
import { toFieldCells } from '../lib/fieldCells';
import { useLookupState } from '../hooks/useLookupOptions';

const WIDE_CONTROLS = new Set(['textarea', 'multiselect', 'radio', 'label']);

function DynamicForm({
  sections = [],
  directives = null,
  values = {},
  errors = {},
  onChange,
  onBlur,
  fetchOptions,
  lookupOptions = null,
  lookupStatus = null,
  onLookupRetry,
}) {
  const visibleSections = useMemo(
    () => resolveVisibleSections(sections, directives),
    [sections, directives]
  );

  const allFields = useMemo(
    () => visibleSections.flatMap((section) => section.fields),
    [visibleSections]
  );

  const ownLookups = useLookupState(allFields, values, lookupOptions ? undefined : fetchOptions);

  const resolvedLookups = lookupOptions ?? ownLookups.options;
  const resolvedStatus = lookupOptions ? (lookupStatus ?? {}) : ownLookups.status;
  const retryLookup = lookupOptions ? onLookupRetry : ownLookups.retry;

  const requiredFields = new Set(directives?.requiredFields ?? []);
  const disabledFields = new Set(directives?.disabledFields ?? []);

  const renderField = (field) => {
    const Component = getFieldComponent(field.control);
    const valueless = isValuelessControl(field.control);
    const lookupState = field.lookupSource ? resolvedStatus[field.code] : null;

    const resolved = {
      ...field,
      required: field.required || requiredFields.has(field.code),
      options: field.lookupSource
        ? (resolvedLookups[field.code] ?? field.options)
        : field.options,
      loading: lookupState === 'loading',
      loadError: lookupState === 'error',
    };

    return (
      <Component
        key={field.code}
        field={resolved}
        value={valueless ? undefined : values[field.code]}
        error={errors[field.code]}
        disabled={disabledFields.has(field.code)}
        onChange={(next) => onChange?.(field.code, next)}
        onBlur={() => onBlur?.(field.code)}
        onRetry={
          lookupState === 'error' && retryLookup
            ? () => retryLookup(field.code)
            : undefined
        }
      />
    );
  };

  return (
    <div className="flex flex-col gap-gutter">
      {visibleSections.map((section) => (
        <section key={section.code}>
          {section.name && (
            <h3 className="font-headline-md text-headline-md mb-gutter text-on-surface">
              {section.name}
            </h3>
          )}

          {/* A section of only documents gets a denser grid sized for square tiles. */}
          <div
            className={
              section.fields.every((field) => field.control === 'file')
                ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'
                : 'grid gap-gutter sm:grid-cols-2'
            }
          >
            {toFieldCells(section.fields).map(({ field, attached }) => (
              <div
                key={field.code}
                className={`flex flex-col gap-3 ${WIDE_CONTROLS.has(field.control) ? 'sm:col-span-2' : ''}`}
              >
                {renderField(field)}
                {attached.map(renderField)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default DynamicForm;
