import { useCallback, useEffect, useState } from 'react';
import { fetchDistricts, fetchPincodeDetails } from '../api/onboardingApi';
import { useMasterOptions } from './useMasterOptions';

/**
 * Districts for the chosen state.
 *
 * The `useCallback` is the reason this hook exists: `useMasterOptions` uses its
 * fetcher as an effect dependency, so binding the state name inline at the call
 * site would re-fetch every render.
 *
 * @param {string} state Exact state name from the states list.
 */
export function useDistricts(state, { enabled = true } = {}) {
  const fetcher = useCallback(() => fetchDistricts(state), [state]);
  return useMasterOptions(fetcher, { enabled: enabled && Boolean(state) });
}

/** Long enough that typing six digits is one request, not three. */
const LOOKUP_DELAY_MS = 400;

const IS_COMPLETE_PIN = /^[1-9][0-9]{5}$/;

/**
 * usePincodeLookup — six digits → `{ state, district, areas }`.
 *
 * Status is `idle | loading | found | notFound | error`. `notFound` and `error`
 * are kept apart deliberately: an unknown PIN is normal (the step just asks the
 * user to fill the rest in), a network failure is not, and merging them would
 * tell someone their valid PIN doesn't exist because the API was down.
 *
 * @param {string} pincode The raw field value; anything not six digits is idle.
 * @param {{ enabled?: boolean }} [options]
 */
export function usePincodeLookup(pincode, { enabled = true } = {}) {
  /** Stamped with the PIN it describes, so staleness is a comparison rather
   *  than a flag to clear on every keystroke. */
  const [result, setResult] = useState(null);

  const active = enabled && IS_COMPLETE_PIN.test(pincode ?? '');

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      fetchPincodeDetails(pincode)
        .then((data) => {
          if (cancelled) return;
          setResult({
            pincode,
            status: data ? 'found' : 'notFound',
            data,
          });
        })
        .catch((lookupError) => {
          if (cancelled) return;
          // `fetchPincodeDetails` only softens a 200 with an empty body, so the
          // 404-means-notFound check has to happen here.
          setResult({
            pincode,
            status: lookupError?.status === 404 ? 'notFound' : 'error',
            data: null,
          });
        });
    }, LOOKUP_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pincode, active]);

  // A result for a different PIN is stale; falling back to `loading` is correct
  // because a fresh lookup is already scheduled or in flight.
  const current = result?.pincode === pincode ? result : null;

  return {
    status: active ? current?.status ?? 'loading' : 'idle',
    data: current?.data ?? null,
  };
}
