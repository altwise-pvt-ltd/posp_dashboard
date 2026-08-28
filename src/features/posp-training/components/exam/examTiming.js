/**
 * The exam clock's *thresholds*, in one place — not its length.
 *
 * The portal runs the countdown and fires the warnings; the header turns the
 * clock red. Those are two components reacting to the same thresholds, so the
 * thresholds are defined once here rather than as matching magic numbers on
 * either side — the toast and the red clock cannot drift apart.
 *
 * How long the paper runs for is not in this file and must not be. The server
 * sets it per attempt (`durationMinutes`, and a `deadline` to measure against),
 * and a constant here would be this app's opinion about a period it does not
 * own. There used to be a `SECTION_SECONDS = 30 * 60` doing exactly that.
 */

/** Below this the clock turns red and pulses, and the first warning fires. */
export const URGENT_SECONDS = 5 * 60;

/** One-shot warnings as the section clock runs down, matched on the second. */
export const TIME_WARNINGS = [
  { at: URGENT_SECONDS, message: `Only ${URGENT_SECONDS / 60} minutes left in this section!` },
  { at: 60, message: 'Only 60 seconds left! Please wrap up.' },
];
