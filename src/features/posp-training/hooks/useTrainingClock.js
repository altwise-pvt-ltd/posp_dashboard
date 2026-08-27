import { useCallback, useEffect, useRef } from 'react';
import {
  hydrateTrainingPlan,
  requiredSeconds,
  servedSeconds,
} from '@/shared/store/trainingPlanStore';
import { updateTrainingProgress } from '../api/trainingApi';
import { loadTrainingRecord } from '../api/trainingRecord';

const SECONDS_PER_HOUR = 60 * 60;

/** How often served time is reported. Coarse on purpose — see `flush`. */
const FLUSH_EVERY_MS = 5 * 60 * 1000;

/** Below this, a send is more risk than it is worth. One minute. */
const MIN_DELTA_HOURS = 1 / 60;

/** Two decimals — 0.01h is 36 seconds, finer than anything here needs. */
const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Is there anything to report? A programme that hasn't been started has served
 * no time, and one the LMS already calls complete has nothing left to add.
 */
const canReport = (plan) => Boolean(plan?.startedAt) && !plan.hoursComplete;

/**
 * useTrainingClock — keep the LMS's served-hours count in step with the clock
 * the POSP is actually watching.
 *
 * `POST /lms/update-progress` takes `hoursToAdd`, a **delta**: the server does
 * `completedHours += hoursToAdd` and checks nothing. There is no "set" form of
 * it, so every guarantee about that number has to be made here.
 *
 * The whole design follows from one decision: **elapsed time is derived, never
 * accumulated.** It is always `now - startedAt`, recomputed from scratch, and
 * `startedAt` is the server's own `trainingStartDate`. Nothing is counted up in
 * a variable that a reload, a second tab or a closed laptop could corrupt.
 *
 * That makes the two failure directions wildly asymmetric:
 *
 *   under-send — a flush is missed. Costs nothing. The next one computes a
 *                bigger slice and the hours arrive late rather than never.
 *   over-send  — a slice goes twice. Permanent, silent, and in the POSP's
 *                favour: the exam unlocks on hours they never sat.
 *
 * So every judgement below leans toward sending too little.
 *
 * ⚠ Wall clock, deliberately. The hours run in real time from the start stamp,
 * including while the POSP is asleep — that is what the start card promises
 * ("the clock runs from the moment you start") and what `startedAt` can measure
 * without the tab being open. Counting only active time would need a tally the
 * server has no way to hold.
 */
export function useTrainingClock(plan) {
  /**
   * Hours the server is *known* to hold — the marker every delta is measured
   * against.
   *
   * Seeded from, and re-seeded by, the server's own `completedHours` rather than
   * anything we persist ourselves. That is what makes a reload free: there is no
   * local tally to lose, because the authority on "what have I already told
   * you?" is the party that was told.
   */
  const syncedRef = useRef(0);

  /** One flush at a time. Two overlapping sends are the classic double-count. */
  const busyRef = useRef(false);

  /**
   * The last send failed, so `syncedRef` can no longer be trusted: a request
   * that times out may well have landed. The next flush re-reads the record
   * before computing anything, which is the only honest way to find out.
   */
  const staleRef = useRef(false);

  /** The live plan, for a flush firing from an interval or a teardown. */
  const planRef = useRef(plan);
  useEffect(() => {
    planRef.current = plan;
  });

  /* A different training row is a different count. Keyed on `trainingId` alone,
     and `completedHours` is deliberately *not* a dependency: this seeds the
     marker, it does not track it. Re-running on every hours change would reset
     it from a plan this hook had just written, undoing its own bookkeeping. */
  useEffect(() => {
    syncedRef.current = Number(plan?.completedHours) || 0;
    staleRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.trainingId]);

  /**
   * Report the time served since the server was last updated.
   *
   * Coarse and deliberate: a five-minute beat, a visible tab, and a one-minute
   * floor. The endpoint is not a render-time concern and must never be driven
   * by one — every extra send is another chance to count the same minutes twice.
   */
  const flush = useCallback(async () => {
    const current = planRef.current;
    if (!canReport(current) || busyRef.current) return;

    busyRef.current = true;
    try {
      /* Recover from a failed send by asking rather than assuming. Bailing when
         the re-read comes back empty is the safe direction: no delta at all
         beats one measured against a marker that may be a send behind. */
      if (staleRef.current) {
        const fresh = await loadTrainingRecord();
        if (!fresh) return;

        syncedRef.current = fresh.completedHours;
        staleRef.current = false;
        hydrateTrainingPlan(fresh);
      }

      /* The same measure the countdown on screen is showing — capped, because
         past the mandated hours there is nothing left to report and an uncapped
         delta would keep adding for as long as the record sat open. */
      const served =
        Math.min(servedSeconds(current), requiredSeconds(current)) / SECONDS_PER_HOUR;
      const delta = round2(served - syncedRef.current);

      /* Rounding loses a few seconds each time. They are not lost for good —
         the next delta is measured against what the server actually took, so
         the remainder simply carries into it. */
      if (delta < MIN_DELTA_HOURS) return;

      const record = await updateTrainingProgress(delta);
      if (!record) {
        /* A success we cannot read is indistinguishable from a failure. Treat
           it as one and let the next flush re-read. */
        staleRef.current = true;
        return;
      }

      syncedRef.current = record.completedHours;

      /* Adopt the reply so the rail and the store agree with the LMS. The
         `startedAt` guard matters: a record that came back without a start stamp
         would drop the page to the "ready to start" screen mid-programme. */
      hydrateTrainingPlan({
        ...record,
        startedAt: record.startedAt ?? current.startedAt,
      });
    } catch {
      /* Swallowed on purpose. Hour-reporting is background work and a failed
         send is recoverable by construction — the time is still in `startedAt`.
         Interrupting a POSP mid-module over it would be noise. */
      staleRef.current = true;
    } finally {
      busyRef.current = false;
    }
  }, []);

  /**
   * Derived to a boolean before it reaches the effect below, and that is not a
   * style choice: `plan` is replaced by every flush that adopts a reply, so
   * depending on the object would tear the interval down and re-arm it on each
   * one — and the teardown reports. A flush that causes a flush is a loop.
   */
  const reporting = canReport(plan);

  useEffect(() => {
    if (!reporting) return undefined;

    /**
     * Visible tabs only.
     *
     * This is the cross-tab guard. Two tabs both ticking on their own interval
     * would each compute the same slice from the same `startedAt` and both send
     * it; only one tab is ever visible, so only one is ever flushing.
     */
    const tick = () => {
      if (document.visibilityState === 'visible') flush();
    };

    /* Leaving the tab is the last reliable moment to report — more reliable
       than `unload`, which browsers increasingly skip. And if it is missed
       anyway, the hours are still in `startedAt` waiting for the next visit. */
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    const interval = setInterval(tick, FLUSH_EVERY_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      flush();
    };
  }, [reporting, flush]);

  /**
   * Report now — for the moment the countdown hits zero, where waiting for the
   * next beat would show a POSP a finished programme the LMS still thinks is
   * five minutes short.
   */
  return { flushNow: flush };
}
