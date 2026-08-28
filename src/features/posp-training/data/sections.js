/**
 * The insurance lines the POSP programme covers, in the order a learner meets
 * them.
 *
 * Almost everything that used to key off this list is gone. The syllabus comes
 * from the LMS (`GET /lms/course`, by insurance type id), and the exam comes
 * from the server as one paper — the `examQuestions` bank these ids used to
 * index, and the per-section scoring that read it, have both been deleted. The
 * paper is graded by `POST /exam/submit` and nothing here has any part in it.
 *
 * What remains is `sectionIdsFor` in `trainingApi.js`, which reads the chosen
 * line's *name* ("Life Insurance", "Both") into these ids so the stored plan
 * carries a machine-readable note of what was enrolled in — `trainingPlanStore`
 * treats a blob without `sectionIds` as not a plan at all.
 *
 * `title` is the full name used in headings; `label` is the short form for
 * chips and summaries, where the word "Insurance" is already implied by the
 * surrounding copy.
 */
export const SECTIONS = [
  { id: 'general', label: 'General', title: 'General Insurance' },
  { id: 'life', label: 'Life', title: 'Life Insurance' },
];
