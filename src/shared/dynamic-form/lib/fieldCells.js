/**
 * Groups a section's fields into grid cells. A field marked `addOnFor` shares
 * the cell of the field it belongs to, so it renders directly under it. If that
 * field is not in the list, it gets a cell of its own.
 */
export function toFieldCells(fields = []) {
  const codes = new Set(fields.map((field) => field.code));
  const isAttached = (field) => Boolean(field.addOnFor) && codes.has(field.addOnFor);

  const attachedByParent = new Map();
  for (const field of fields) {
    if (!isAttached(field)) continue;
    const list = attachedByParent.get(field.addOnFor) ?? [];
    list.push(field);
    attachedByParent.set(field.addOnFor, list);
  }

  return fields
    .filter((field) => !isAttached(field))
    .map((field) => ({ field, attached: attachedByParent.get(field.code) ?? [] }));
}
