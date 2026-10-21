export function resolveVisibleSections(sections = [], directives = null) {
  const hiddenSections = new Set(directives?.hiddenSections ?? []);
  const hiddenFields = new Set(directives?.hiddenFields ?? []);

  return sections
    .filter((section) => !hiddenSections.has(section.code))
    .map((section) => ({
      ...section,
      fields: (section.fields ?? []).filter((field) => !hiddenFields.has(field.code)),
    }))
    .filter((section) => section.fields.length > 0);
}
