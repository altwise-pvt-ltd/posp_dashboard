/** Each section is scored on its own, and cleared at 50% or above. */
export const PASS_PERCENTAGE = 50;

/**
 * Score one exam section.
 *
 * `answers` maps a question id to the index of the option the learner picked,
 * which is what `correctOption` on the question is measured against. Kept as a
 * plain function — no React, no module state — so the result screen can be read
 * top to bottom and the rule is testable on its own.
 */
export function scoreSection(questions = [], answers = {}) {
  const total = questions.length;
  const correct = questions.filter((question) => answers[question.id] === question.correctOption).length;
  const attempted = Object.keys(answers).length;
  const percentage = total === 0 ? 0 : (correct / total) * 100;

  return {
    total,
    attempted,
    correct,
    percentage,
    passed: percentage >= PASS_PERCENTAGE,
  };
}
