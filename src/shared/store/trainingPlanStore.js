import { create } from 'zustand';

/**
 * Which insurance line the POSP is training in — Life, General, or Both.
 *
 * Chosen once, on arrival at `/posp-training`, and everything downstream is cut
 * to it: the syllabus shown, the exam sections sat, and the hours on the clock
 * (`requiredHours` is the server's number — 15 for one line, 30 for both).
 *
 * Persisted for the same reason the training clock needs it to be: the countdown
 * is client-side, so a reload that forgot the choice would also forget how long
 * the POSP has to sit. Kept as one JSON blob rather than split keys — unlike the
 * verification verdict, no one debugs this by reading localStorage, and the
 * fields are only ever read together.
 *
 * ⚠ Local-only. The server records the choice at the point it matters (the exam
 * and the certificate), but nothing is fetched back yet, so clearing site data
 * re-asks the question.
 */
const KEY = 'trainingPlan';

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // `sectionIds` is what the page filters on, so a blob without it is no more
    // useful than none at all.
    return parsed?.sectionIds?.length ? parsed : null;
  } catch {
    return null;
  }
};

const persist = (plan) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    // Ignore — this session carries on with the in-memory copy; only the
    // "don't ask me again after a reload" is lost.
  }
};

export const useTrainingPlanStore = create((set, get) => ({
  /**
   * `{ id, name, requiredHours, sectionIds, startedAt }`, or null before they
   * choose. `startedAt` is absent until they press Start Training — choosing a
   * line and beginning it are two separate acts, and only the second one starts
   * the clock.
   */
  plan: read(),

  select: (plan) => {
    persist(plan);
    set({ plan });
  },

  /**
   * The programme is open. `startedAt` is an epoch millisecond stamp, which is
   * what lets a reload work out how much of the period has already run instead
   * of handing back a full clock.
   */
  markStarted: (startedAt = Date.now()) => {
    const plan = get().plan;
    if (!plan) return;

    const started = { ...plan, startedAt };
    persist(started);
    set({ plan: started });
  },

  /**
   * Adopt the LMS's own training record — `GET /lms/progress/{pospId}`.
   *
   * This is what turns the store from a memory into a cache. The choice used to
   * exist only here, so a POSP on a second device was asked to pick a line the
   * server already had on file; now the server is asked first and this holds the
   * answer for the rest of the session.
   *
   * A null record means the LMS has nothing for this POSP — they have genuinely
   * not chosen yet — and the local plan is cleared to match. That is deliberate
   * and it is the one case where hydration *removes* state: a stale local plan
   * outliving the record it described would show a syllabus for a programme the
   * server does not think exists, and the exam would refuse them at the end of
   * it. Better to ask again now than to fail then.
   */
  hydrate: (record) => {
    if (!record) {
      try {
        localStorage.removeItem(KEY);
      } catch {
        // Ignore.
      }
      set({ plan: null });
      return;
    }

    persist(record);
    set({ plan: record });
  },

  /**
   * The *server's* word that the programme is already open — `overallStatus`
   * came back `VERIFIED_UNDER_TRAINING` on sign-in.
   *
   * Separate from `markStarted` because the two have different rights over the
   * stamp. `markStarted` is the button being pressed, and it overwrites; this is
   * a resume reconciling with the server, and it must only ever fill a gap — a
   * POSP ten hours into their period would otherwise have the clock rewound to
   * full on every sign-in.
   *
   * ⚠ The stamp written here is *now*, not the true enrolment time, because the
   * server does not send one. It is only reached when the local plan survived
   * but its `startedAt` did not, which is rare; and over-serving hours is the
   * safe direction to be wrong in. A `GET /lms/training-status` carrying the
   * real `startedAt` is what retires this caveat — see the note on the store.
   */
  markEnrolled: () => {
    const plan = get().plan;
    if (!plan || plan.startedAt) return;

    const started = { ...plan, startedAt: Date.now() };
    persist(started);
    set({ plan: started });
  },

  clear: () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Ignore.
    }
    set({ plan: null });
  },
}));

export const getTrainingPlan = () => useTrainingPlanStore.getState().plan;
export const selectTrainingPlan = (plan) => useTrainingPlanStore.getState().select(plan);
export const markTrainingStarted = () => useTrainingPlanStore.getState().markStarted();
export const markTrainingEnrolled = () => useTrainingPlanStore.getState().markEnrolled();
export const hydrateTrainingPlan = (record) => useTrainingPlanStore.getState().hydrate(record);
export const resetTrainingPlan = () => useTrainingPlanStore.getState().clear();

/**
 * ── The three readings of the clock ───────────────────────────────────────────
 *
 * One measurement, exported three ways, so that the countdown on screen and the
 * hours reported to the LMS can never be two different numbers. They were, once:
 * the display read the server's `remainingHours` while nothing on earth updated
 * it, so every reload handed the POSP their fifteen hours back.
 *
 * Everything is derived from `startedAt` — the server's own `trainingStartDate`
 * — and never accumulated, which is what makes the figures survive a reload, a
 * second device, and a week away. See `useTrainingClock` for the other half.
 */

/** The mandated period, in seconds. 15 hours for one line, 30 for both. */
export const requiredSeconds = (plan) => (Number(plan?.requiredHours) || 0) * 60 * 60;

/**
 * Seconds served so far, measured from the start stamp rather than from when
 * the page happened to mount. Uncapped — the caller decides what passing the
 * mandated period means.
 *
 * Floored at zero: a `startedAt` in the future — a device with a wrong clock, or
 * a stamp that parsed into the wrong timezone — would otherwise read as negative
 * time served and put *more* than the full period on the clock, which looks like
 * a broken screen rather than the skew it is.
 */
export const servedSeconds = (plan) => {
  if (!plan?.startedAt) return 0;
  return Math.max(Math.floor((Date.now() - plan.startedAt) / 1000), 0);
};

/**
 * Seconds still to serve.
 *
 * Zero when the plan hasn't been started, which the page reads as "not running"
 * rather than "finished"; the two are told apart by `startedAt`, not by the
 * clock.
 *
 * `hoursComplete` is checked first because zero is a real answer here and an
 * ambiguous one: a served programme and one the server has never heard from both
 * arrive as 0 remaining, and only the flag tells them apart.
 *
 * Two measures, and the smaller wins.
 *
 * The wall clock is the honest one in the ordinary case. But it is not the only
 * way hours reach the record: "Skip timer" posts the outstanding balance
 * straight to `update-progress`, and hours credited on another device land the
 * same way. In both cases the server holds a count this browser's arithmetic
 * knows nothing about, and reading `startedAt` alone put a POSP back at 29:56:41
 * against a record already reading `completedHours: 30`.
 *
 * ⚠ Not the same as trusting `remainingHours` — that is the server's own
 * subtraction and the note in `normalizeProgress` still stands. This is
 * `completedHours`, the raw count, and taking the *minimum* is what makes the
 * lag safe: between flushes the server is behind, which makes its figure the
 * larger of the two and leaves the wall clock in charge. It only wins when it
 * holds more hours than this tab can account for, which is exactly the case
 * that was stuck.
 *
 * `hoursComplete` stays the separate check above it. That is the LMS declaring
 * the period *settled*; this is only the count reaching the mandated figure, and
 * the press that turns one into the other is still `complete-training`.
 */
export const remainingSeconds = (plan) => {
  if (!plan?.startedAt) return 0;
  if (plan.hoursComplete) return 0;

  const required = requiredSeconds(plan);
  const byClock = required - servedSeconds(plan);
  const byServer = required - (Number(plan.completedHours) || 0) * 60 * 60;

  return Math.max(Math.min(byClock, byServer), 0);
};
