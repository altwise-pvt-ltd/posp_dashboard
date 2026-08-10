import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useCountdown — a one-second countdown that arms once and stays armed.
 *
 * The remaining time is mirrored in a ref so the interval callback can read the
 * live value without the effect re-running — and re-arming the interval — on
 * every tick. `onTick` therefore fires from an event-like context exactly once
 * per second, which is what lets a caller hang one-shot thresholds off it
 * ("five minutes left", "time up") without them firing twice.
 *
 * The interval keeps running once the clock reaches zero, doing nothing, so
 * that `reset` can put time back without the caller having to toggle `running`
 * to bring the timer back to life.
 *
 * @param {number} duration  seconds on the clock to begin with
 * @param {{ running?: boolean, onTick?: (secondsLeft: number) => void }} options
 */
export function useCountdown(duration, { running = false, onTick } = {}) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const secondsLeftRef = useRef(duration);
  const onTickRef = useRef(onTick);

  // Keep the callback current without listing it as an effect dependency — a
  // fresh arrow on every render would otherwise restart the interval each time.
  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    if (!running) return undefined;

    const interval = setInterval(() => {
      const remaining = secondsLeftRef.current;
      if (remaining <= 0) return;

      const next = remaining - 1;
      secondsLeftRef.current = next;
      setSecondsLeft(next);
      onTickRef.current?.(next);
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  /** Put `seconds` back on the clock — a fresh section, or a skip to zero. */
  const reset = useCallback((seconds) => {
    secondsLeftRef.current = seconds;
    setSecondsLeft(seconds);
  }, []);

  return { secondsLeft, reset };
}
