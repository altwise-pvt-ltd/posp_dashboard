import { BookOpen, HeartPulse, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import SectionSyllabus from './SectionSyllabus';

/**
 * Insurance type id → the icon that stands for it. Keyed by the LMS's own ints
 * (1 Life, 2 General) rather than by name, so a renamed course keeps its icon.
 * `BookOpen` covers a line this app has never met.
 */
const COURSE_ICONS = {
  1: HeartPulse,
  2: ShieldCheck,
};

/**
 * The study material column — everything a POSP actually reads during the
 * mandated hours, fetched from `GET /lms/course`.
 *
 * It carries its own loading and error states rather than letting the page gate
 * on them, and that split is the point: the countdown, the rail and the exam are
 * driven by the training record and must keep running whether or not the
 * material arrives. A failed fetch here costs a learner their reading list until
 * they press Try again — never their hours.
 */
function StudyMaterial({ courses, loading, error, onRetry }) {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-16"
      >
        <Loader2
          className="size-4 animate-spin text-orange-600 motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p className="text-xs text-slate-500">Loading your study material…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center">
        <span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <TriangleAlert className="size-4" aria-hidden="true" />
        </span>

        <h2 className="mt-4 text-sm font-extrabold tracking-tight text-slate-900">
          Couldn't load your study material
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">{error.message}</p>
        {/* Said plainly, because the clock on the right is still running and a
            learner staring at an error should know it isn't costing them. */}
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Your training hours are unaffected and still counting.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98]"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
        <span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
          <BookOpen className="size-4" aria-hidden="true" />
        </span>

        <h2 className="mt-4 text-sm font-extrabold tracking-tight text-slate-900">
          No material published yet
        </h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Your chapters will appear here as soon as they're released. Your hours keep counting in
          the meantime.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {courses.map((course) => (
        <SectionSyllabus
          key={course.id}
          title={course.name}
          icon={COURSE_ICONS[course.insuranceTypeId] ?? BookOpen}
          modules={course.modules}
        />
      ))}
    </div>
  );
}

export default StudyMaterial;
