/**
 * The exam clock, in one place.
 *
 * The portal runs the countdown and fires the warnings; the header turns the
 * clock red. Those are two components reacting to the same thresholds, so the
 * thresholds are defined once here rather than as matching magic numbers on
 * either side — the toast and the red clock cannot drift apart.
 */

/** Every section runs on its own clock. */
export const SECTION_SECONDS = 30 * 60;

/** Below this the clock turns red and pulses, and the first warning fires. */
export const URGENT_SECONDS = 5 * 60;

/** One-shot warnings as the section clock runs down, matched on the second. */
export const TIME_WARNINGS = [
  { at: URGENT_SECONDS, message: `Only ${URGENT_SECONDS / 60} minutes left in this section!` },
  { at: 60, message: 'Only 60 seconds left! Please wrap up.' },
];
