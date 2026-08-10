/**
 * Duration formatting for the two clocks in this module: the 15-hour study
 * countdown on the training page and the 30-minute section clock in the exam.
 * Both render zero-padded figures so the digits hold their columns as they tick.
 */

/** Split a duration into zero-padded `hh` / `mm` / `ss` parts. */
export function splitDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  return {
    hours: String(Math.floor(seconds / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((seconds % 3600) / 60)).padStart(2, '0'),
    seconds: String(seconds % 60).padStart(2, '0'),
  };
}

/**
 * 'MM:SS'. Minutes deliberately do not wrap at 60 — a section longer than an
 * hour should read 90:00 rather than silently restarting at 30:00.
 */
export function formatMinutesSeconds(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
