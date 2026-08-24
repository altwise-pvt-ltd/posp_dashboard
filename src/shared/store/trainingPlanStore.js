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
export const resetTrainingPlan = () => useTrainingPlanStore.getState().clear();

/**
 * Seconds still to serve, measured from `startedAt` rather than from when the
 * page happened to mount — a reload used to hand back the full period.
 *
 * Zero when the plan hasn't been started, which the page reads as "not running"
 * rather than "finished"; the two are told apart by `startedAt`, not by the
 * clock.
 */
export const remainingSeconds = (plan) => {
  if (!plan?.startedAt) return 0;

  const total = plan.requiredHours * 60 * 60;
  const served = Math.floor((Date.now() - plan.startedAt) / 1000);
  return Math.max(total - served, 0);
};
