import StageTrail from "./StageTrail";

/**
 * The verdict, and the journey it sits in the middle of.
 *
 * Two tracks from `lg`: the status on the left, the stage tracker on the right
 * rather than stacked under it, which is where most of the old page height went.
 * The icon sits beside the heading for the same reason — the centred column it
 * replaced cost ~100px of pure vertical run.
 *
 * Everything status-dependent arrives as `ui` (one entry from `STATUS_UI`), so
 * this component has no idea what the three verdicts are.
 */
export default function StatusBand({ ui, stageState }) {
  const StatusIcon = ui.icon;

  return (
    <div
      className={`grid gap-6 border-b border-slate-100 p-4 sm:bg-white sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-center lg:gap-12 ${ui.bandClass}`}
    >
      <div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ring-1 ${ui.badgeClass}`}
        >
          <span aria-hidden="true" className={`size-1.5 rounded-full ${ui.dotClass}`} />
          {ui.badge}
        </span>

        <div className="mt-3 flex items-center gap-3">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-full ring-1 sm:size-11 ${ui.iconClass}`}
          >
            <StatusIcon className="size-5 sm:size-6" strokeWidth={2} aria-hidden="true" />
          </span>

          <h1
            id="verification-heading"
            className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
          >
            {ui.heading}
          </h1>
        </div>

        {/* Same message at two lengths — see `shortCopy` in STATUS_UI. */}
        <p className="mt-2.5 text-sm leading-5 text-slate-600 sm:hidden">
          {ui.shortCopy}
        </p>
        <p className="mt-2.5 hidden max-w-xl text-[13px] leading-5 text-slate-500 sm:block">
          {ui.copy}
        </p>
      </div>

      <StageTrail stageState={stageState} />
    </div>
  );
}
