import { SECTIONS } from '../data/sections';

/**
 * Which local syllabus sections an option covers, matched on its name rather
 * than its id.
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
  sectionIds: sectionIdsFor(entry.name),
});

/**
 * The lines a POSP can train in.
 */
export async function fetchInsuranceTypes() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = [
    { id: 1, name: 'Life Insurance', requiredHours: 15 },
    { id: 2, name: 'General Insurance', requiredHours: 15 },
    { id: 3, name: 'Both (Life & General)', requiredHours: 30 }
  ];

  return data.map(normalizeInsuranceType);
}

/**
 * Commit the choice.
 */
export async function selectInsuranceType(insuranceTypeId) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { success: true };
}

/**
 * Open the programme.
 */
export async function startTraining() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { success: true };
}

/**
 * Ask the LMS to clear this POSP for training.
 */
export async function verifyForTraining() {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { redirectUrl: null, data: { status: 'Success' } };
}
