import { useMemo } from 'react';
import { getFieldComponent, isValuelessControl } from './fields/registry';
import { resolveVisibleSections } from '../lib/visibleSections';
import { useLookupOptions } from '../hooks/useLookupOptions';

const WIDE_CONTROLS = new Set(['textarea', 'multiselect', 'radio', 'label', 'file']);

function DynamicForm({
  sections = [],
  directives = null,
  values = {},
  errors = {},
  onChange,
  onBlur,
  fetchOptions,
  lookupOptions = null,
}) {
  const visibleSections = useMemo(
    () => resolveVisibleSections(sections, directives),
    [sections, directives]
  );

  const allFields = useMemo(
    () => visibleSections.flatMap((section) => section.fields),
    [visibleSections]
  );

  const ownLookupOptions = useLookupOptions(
    allFields,
    values,
    lookupOptions ? undefined : fetchOptions
  );

  const resolvedLookups = lookupOptions ?? ownLookupOptions;

  const requiredFields = new Set(directives?.requiredFields ?? []);
  const disabledFields = new Set(directives?.disabledFields ?? []);

  return (
    <div className="flex flex-col gap-gutter">
      {visibleSections.map((section) => (
        <section key={section.code}>
          {section.name && (
            <h3 className="font-headline-md text-headline-md mb-gutter text-on-surface">
              {section.name}
            </h3>
          )}

          <div className="grid gap-gutter sm:grid-cols-2">
            {section.fields.map((field) => {
              const Component = getFieldComponent(field.control);
              const valueless = isValuelessControl(field.control);

              const resolved = {
                ...field,
                required: field.required || requiredFields.has(field.code),
                options: field.lookupSource
                  ? (resolvedLookups[field.code] ?? field.options)
                  : field.options,
              };

              return (
                <div
                  key={field.code}
                  className={WIDE_CONTROLS.has(field.control) ? 'sm:col-span-2' : ''}
                >
                  <Component
                    field={resolved}
                    value={valueless ? undefined : values[field.code]}
                    error={errors[field.code]}
                    disabled={disabledFields.has(field.code)}
                    onChange={(next) => onChange?.(field.code, next)}
                    onBlur={() => onBlur?.(field.code)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default DynamicForm;
