/**
 * The insurance lines the POSP programme covers, in the order a learner meets
 * them.
 *
 * One list, because the same ids key everything downstream: the syllabus in
 * `trainingModules`, the question banks in `examQuestions`, and the answers and
 * scores the exam keeps per section. Adding a third line means adding it here
 * plus its modules and questions — no screen hardcodes "general" or "life".
 *
 * `title` is the full name used in headings; `label` is the short form for
 * chips and summaries, where the word "Insurance" is already implied by the
 * surrounding copy.
 */
export const SECTIONS = [
  { id: 'general', label: 'General', title: 'General Insurance' },
  { id: 'life', label: 'Life', title: 'Life Insurance' },
];
