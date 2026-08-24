import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { SECTIONS } from '../data/sections';

/**
 * Which local syllabus sections an option covers, matched on its name rather
 * than its id — the ids are the LMS's own and say nothing about content, while
 * "Both" / "Life Insurance" / "General Insurance" do. A name that matches
 * nothing falls back to every section, which over-serves rather than silently
 * hiding material a POSP paid hours for.
 */
const sectionIdsFor = (name = '') => {
  const text = name.toLowerCase();
  if (text.includes('both')) return SECTIONS.map((s) => s.id);

  const matched = SECTIONS.filter((s) => text.includes(s.id));
  return matched.length ? matched.map((s) => s.id) : SECTIONS.map((s) => s.id);
};

const normalizeInsuranceType = (entry = {}) => ({
  id: entry.id ?? null,
  name: entry.name ?? '',
  requiredHours: Number(entry.requiredHours) || 0,
  /** App-side: the syllabus and exam sections this option opens. */
  sectionIds: sectionIdsFor(entry.name),
});

/**
 * The lines a POSP can train in — `GET /lms/insurance-types`.
 *
 * Rejects on failure: the choice gates the whole programme, so an empty list
 * shown as "no options" would read as a decision rather than a broken call.
 */
export async function fetchInsuranceTypes() {
  const response = await api.get(ENDPOINTS.lms.insuranceTypes);
  const data = unwrap(response);

  return Array.isArray(data) ? data.map(normalizeInsuranceType) : [];
}

/**
 * Commit the choice — `POST /lms/select-insurance-type`.
 *
 * Only the id goes up; the name and the hours are the server's own and it
 * already knows them. Rejects on failure, because the caller's job is to stay
 * on the choice screen rather than start a clock the server isn't counting.
 */
export async function selectInsuranceType(insuranceTypeId) {
  const response = await api.post(ENDPOINTS.lms.selectInsuranceType, {
    insuranceTypeId,
  });
  return unwrap(response);
}

/**
 * Open the programme — `POST /lms/start-training`. The mandated hours run from
 * this call, not from the selection above it.
 *
 * Deliberately a separate press of a separate button: choosing a line is a
 * decision, starting the clock is a commitment, and a POSP who picked "Both" at
 * midnight should be able to read what the 30 hours involve before any of them
 * begin running.
 *
 * No body — the bearer token says who, and `select-insurance-type` has already
 * said which line. Sending the id again would be a second copy of a fact the
 * server is holding, able to disagree with the one it trusts.
 */
export async function startTraining() {
  const response = await api.post(ENDPOINTS.lms.startTraining);
  return unwrap(response);
}

/** The keys the handoff URL has been seen under, in the order they're trusted. */
const URL_KEYS = ['redirectUrl', 'lmsUrl', 'trainingUrl', 'url'];

const firstUrl = (data) => {
  for (const key of URL_KEYS) {
    const value = data?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

/**
 * Ask the LMS to clear this POSP for training — `POST /lms/verify-for-training`.
 *
 * Returns `{ redirectUrl, data }`. `redirectUrl` is null when the reply is a
 * plain go-ahead, which is the caller's cue to stay in the app and route to
 * `/posp-training`; when it's a string the course lives elsewhere and that URL
 * is where the POSP belongs.
 *
 * Rejects with an ApiError like every other call, because this one is a gate —
 * a failure here has to stop the navigation, not be swallowed behind it.
 */
export async function verifyForTraining() {
  const response = await api.post(ENDPOINTS.lms.verifyForTraining);
  const data = unwrap(response) ?? {};

  return { redirectUrl: firstUrl(data), data };
}
