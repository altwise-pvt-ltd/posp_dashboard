import { useMemo, useRef, useState } from 'react';
import { useDynamicFormValues } from '@/shared/dynamic-form/hooks/useDynamicFormValues';
import { useLookupState } from '@/shared/dynamic-form/hooks/useLookupOptions';
import {
  isFieldAnswered,
  validateField,
  validateFields,
} from '@/shared/dynamic-form/lib/validateFields';
import { fetchLookupOptions } from '../api/quoteMetadataApi';
import { addOnValueCode, resolveQuoteForm } from '../lib/quoteSections';
import { useQuoteRules } from './useQuoteRules';

const RULES_FAILED = "Couldn't check the form's rules. Press Save to try again.";

/**
 * Form state shared by the create wizard and the edit form: answers, errors,
 * rules, the visible fields, lookups, and the rules check Save waits on.
 */
export function useQuoteForm({
  metadata,
  baseSections,
  seed,
  productId,
  subProductId,
  evaluateOnMount = false,
}) {
  const { values, setValue, setAllValues } = useDynamicFormValues(baseSections, seed);
  const [errors, setErrors] = useState({});

  const [checking, setChecking] = useState(false);
  const [rulesError, setRulesError] = useState('');
  // Counts edits, so a save drops out if the answers changed while it waited.
  const editRef = useRef(0);

  const rules = useQuoteRules({ productId, subProductId, values, evaluateOnMount });
  const directives = rules.directives ?? metadata.directives;

  const { sections, fields, requiredCodes } = useMemo(
    () => resolveQuoteForm(baseSections, values, directives),
    [baseSections, values, directives]
  );

  const fieldsByCode = useMemo(() => new Map(fields.map((field) => [field.code, field])), [fields]);

  // Lookups are prefetched for every visible field and deduped by source and parent.
  const lookups = useLookupState(fields, values, fetchLookupOptions);

  // Add-ons that carry an amount; unticking one clears its amount.
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

  const clearError = (code) =>
    setErrors((prev) => {
      if (!prev[code]) return prev;
      const rest = { ...prev };
      delete rest[code];
      return rest;
    });

  const change = (code, next) => {
    setValue(code, next);
    setRulesError('');
    clearError(code);
    editRef.current += 1;

    if (!next && addOnsWithValue.has(code)) {
      const valueCode = addOnValueCode(code);
      setValue(valueCode, '');
      clearError(valueCode);
    }
  };

  // Answered fields are checked on blur; blank ones wait for Next or Save.
  const blur = (code) => {
    const field = fieldsByCode.get(code);
    if (!field || !isFieldAnswered(field, values[code])) return;

    const message = validateField(field, values[code], requiredCodes);
    if (message) setErrors((prev) => ({ ...prev, [code]: message }));
    else clearError(code);
  };

  /**
   * Waits for the rules on the current answers, then validates every visible
   * field against them. Resolves with { sections, fields, first } where `first`
   * is the first invalid field or null, or with null when the rules check
   * failed or the answers changed while it ran.
   */
  const validateForSave = async () => {
    const edit = editRef.current;
    setRulesError('');
    setChecking(true);

    let latest;
    try {
      latest = (await rules.evaluateNow(values)) ?? metadata.directives;
    } catch {
      setChecking(false);
      setRulesError(RULES_FAILED);
      return null;
    }

    setChecking(false);
    if (editRef.current !== edit) return null;

    const form = resolveQuoteForm(baseSections, values, latest);
    const found = validateFields(form.fields, values, form.requiredCodes);
    setErrors(found);

    return {
      sections: form.sections,
      fields: form.fields,
      first: form.fields.find((field) => found[field.code]) ?? null,
    };
  };

  return {
    values,
    setAllValues,
    errors,
    setErrors,
    directives,
    sections,
    fields,
    requiredCodes,
    lookups,
    checking,
    rulesError,
    clearRulesError: () => setRulesError(''),
    change,
    blur,
    validateForSave,
  };
}
