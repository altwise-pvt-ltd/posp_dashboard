import { ApiError } from '@/shared/api/ApiError';
import { ensurePospProfile, usePospProfileStore } from '@/shared/store/pospProfileStore';
import { fetchTrainingProgress } from './trainingApi';

/**
 * This POSP's training record, id lookup included.
 *
 * Two calls in order, because the second needs the first: `GET /lms/progress` is
 * keyed by the **POSP** id, and the only place that id appears is `/posp/me`.
 * The two are different uuids for the same person and swapping them 404s — a
 * rule worth stating once rather than in every caller.
 *
 * `ensurePospProfile` usually resolves instantly (the sign-in path has already
 * fired that request and the store dedupes against it), so this is one round
 * trip in wall-clock terms, not two.
 *
 * Resolves to the record, or to **null** when the LMS holds none — a POSP who
 * has not chosen a line yet. Rejects when the lookup could not be *made*, which
 * is a different thing entirely: callers must be able to tell "no record" from
 * "no answer", because only the first is safe to act on.
 *
 * Deliberately does not touch the plan store. Hydrating is a decision — the page
 * load adopts a null as "ask them to choose again", while a background refresh
 * must not — and it belongs to whoever asked.
 */
export async function loadTrainingRecord() {
  const profile = await ensurePospProfile();

  /* No id means the profile call failed — `ensureLoaded` resolves to null rather
     than rejecting, so the reason is on the store and this turns it back into a
     throw. */
  if (!profile?.id) {
    throw (
      usePospProfileStore.getState().error ??
      new ApiError({ message: 'Could not load your POSP record. Please try again.' })
    );
  }

  return fetchTrainingProgress(profile.id);
}
