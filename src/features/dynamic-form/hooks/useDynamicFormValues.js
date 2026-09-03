import { useCallback, useState } from 'react';
import { buildDefaults } from '../lib/buildDefaults';

export function useDynamicFormValues(sections, presetValues) {
  const [values, setAllValues] = useState(() => buildDefaults(sections, presetValues));

  const setValue = useCallback((code, next) => {
    setAllValues((prev) => (prev[code] === next ? prev : { ...prev, [code]: next }));
  }, []);

  const reset = useCallback(() => {
    setAllValues(buildDefaults(sections, presetValues));
  }, [sections, presetValues]);

  return { values, setValue, setAllValues, reset };
}
