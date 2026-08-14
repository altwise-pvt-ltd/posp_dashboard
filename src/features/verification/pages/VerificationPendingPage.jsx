import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Files,
  Fingerprint,
  GraduationCap,
  Headset,
  Home,
  PencilLine,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import FunnelLayout, { FUNNEL_SHELL } from "@/shared/layouts/FunnelLayout";
import Breadcrumb from "@/shared/components/Breadcrumb";
import {
  useVerificationStore,
  VERIFICATION,
} from "@/shared/store/verificationStore";

const SUPPORT_EMAIL = "support@letsinsurance.com";

/**
 * What the back office is actually checking, one row per onboarding step. The
 * ids are what a rejection points at, so a reason lands against the document it
 * refers to rather than in a heap of error text at the top of the page.
 */
const UNDER_REVIEW = [
  { id: "pan", icon: CreditCard, label: "PAN card", detail: "Name and number matched against the card" },
  { id: "aadhaar", icon: Fingerprint, label: "Aadhaar / KYC", detail: "Identity and address confirmed" },
  { id: "photo", icon: UserRound, label: "Photograph", detail: "Checked against your Aadhaar record" },
  { id: "bank", icon: Banknote, label: "Bank account", detail: "Verified for commission payouts" },
  { id: "education", icon: GraduationCap, label: "Education", detail: "Minimum qualification per IRDAI" },
];

/** The three stages either side of this screen — the journey, not a progress bar. */
const STAGES = [
  { label: "Application submitted", detail: "Your details reached us" },
  { label: "Team verification", detail: "A reviewer checks your documents" },
  { label: "POSP training", detail: "15 hours, then the exam" },
];

/**
 * Everything that changes with the verdict, in one table rather than spread
 * across the markup as three-way ternaries. Adding a fourth status — an
 * "on hold pending a manual call", say — is an entry here, not a sweep of JSX.
 *
 * `copy` and `shortCopy` say the same thing at two lengths. The long one is a
 * desktop paragraph; on a phone the same text ran to ten lines of grey and read
 * as a wall, so below `sm` the short one is shown instead. Both make the same
 * promises — the short version is a trim, not a different message.
 *
 * `bandClass` tints the status band on mobile only. On a phone the verdict has
 * to be readable at arm's length before anything is parsed, and a colour wash
 * does that faster than a badge; on desktop the band stays white, where the
 * badge and the icon have room to carry it.
 */
const STATUS_UI = {
  [VERIFICATION.PENDING]: {
    badge: "Under review",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
    dotClass: "animate-pulse bg-amber-500 motion-reduce:animate-none",
    icon: ShieldCheck,
    iconClass: "bg-orange-50 text-orange-500 ring-orange-100",
    bandClass: "bg-amber-50/60",
    heading: "Your profile is with our team",
    copy: "A reviewer is checking your documents now. This usually takes 24 to 48 working hours, and we'll notify you the moment it's done — you don't need to keep this page open.",
    shortCopy: "A reviewer has your documents. Usually 24 to 48 working hours — we'll notify you when it's done.",
    checklistHeading: "With the reviewer",
  },
  [VERIFICATION.VERIFIED]: {
    badge: "Verified",
    badgeClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    dotClass: "bg-emerald-500",
    icon: BadgeCheck,
    iconClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    bandClass: "bg-emerald-50/60",
    heading: "Your profile has been verified",
    copy: "Everything checked out. Your 15-hour POSP training programme is open — start whenever you're ready.",
    shortCopy: "Everything checked out. Your 15-hour training programme is open.",
    checklistHeading: "Checked and cleared",
  },
  [VERIFICATION.REJECTED]: {
    badge: "Action needed",
    badgeClass: "bg-rose-50 text-rose-600 ring-rose-100",
    dotClass: "bg-rose-500",
    icon: ShieldAlert,
    iconClass: "bg-rose-50 text-rose-600 ring-rose-100",
    bandClass: "bg-rose-50/60",
    heading: "A few things need fixing",
    copy: "Our reviewer couldn't clear everything. Update the details flagged below and send your application back — the rest of your profile is already accepted, so you only need to fix what's marked.",
    shortCopy: "Some details need fixing. Update what's flagged and resend — the rest is already accepted.",
    checklistHeading: "Needs your attention",
  },
};

/**
 * One stage in the tracker. `state` is 'done' | 'current' | 'failed' |
 * 'upcoming', which drives the marker, the rail below it and the weight of the
 * label.
 *
 * Runs vertically, and from `sm` up it is the only tracker on the page. It sits
 * in the narrow right-hand track of the status band, where a horizontal trail
 * would wrap "Application submitted" onto two lines and cost more height than
 * the stacked version it replaced. Below `sm` it is hidden and `StageStrip`
 * takes over — three stages with their descriptions is 160px of a phone screen
 * to say which of three boxes you are in.
 */
function Stage({ stage, state, isLast }) {
  const done = state === "done";
  const current = state === "current";
  const failed = state === "failed";

  return (
    <li className="relative flex gap-3 pb-3.5 last:pb-0">
      {/* Rail down to the next marker. Skipped on the last stage so the line
          never runs past the end of the trail. */}
      {!isLast && (
        <span
          aria-hidden="true"
          className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5 ${
            done ? "bg-orange-500" : "bg-slate-200"
          }`}
        />
      )}

      <span
        className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full ${
          done
            ? "bg-orange-500 text-white"
            : failed
              ? "bg-rose-500 text-white"
              : current
                ? "bg-orange-50 text-orange-600 ring-4 ring-orange-100"
                : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? (
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        ) : failed ? (
          <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
        ) : (
          <span
            className={`size-1.5 rounded-full ${current ? "animate-pulse bg-orange-500 motion-reduce:animate-none" : "bg-slate-300"}`}
            aria-hidden="true"
          />
        )}
      </span>

      <div className="min-w-0 pt-0.5">
        <p
          className={`text-[13px] font-bold leading-4 ${
            failed
              ? "text-rose-600"
              : current
                ? "text-orange-600"
                : done
                  ? "text-slate-800"
                  : "text-slate-400"
          }`}
        >
          {stage.label}
        </p>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{stage.detail}</p>
      </div>
    </li>
  );
}

/**
 * The mobile counterpart to `Stage` — the same three stages as a horizontal rail
 * of markers with only the stage you are actually on spelled out underneath.
 *
 * Labelling one stage instead of three is the whole saving. The other two are
 * either behind you or not your problem yet, and their descriptions were the
 * bulk of the height; the markers still show where you sit in the run of three,
 * which is all the trail was ever being read for on a phone.
 *
 * Reads off the same `STAGES` and the same `stageState` as the vertical
 * tracker, so the two can't drift apart. Only one of them is in the accessibility
 * tree at any width — the other is `display: none`.
 */
function StageStrip({ stageState }) {
  // The stage you are on is the first one not already behind you. Verified
  // pushes that to training, a rejection leaves it on the review stage as a
  // failure rather than advancing it.
  const activeIndex = STAGES.findIndex((_, index) => stageState(index) !== "done");
  const active = STAGES[activeIndex] ?? STAGES[STAGES.length - 1];
  const activeState = stageState(activeIndex);

  return (
    <div className="border-b border-slate-100 px-4 py-3.5 sm:hidden">
      <ol className="flex items-center gap-1.5" aria-label="Application progress">
        {STAGES.map((stage, index) => {
          const state = stageState(index);
          const done = state === "done";
          const current = state === "current";
          const failed = state === "failed";
          const isLast = index === STAGES.length - 1;

          return (
            <li
              key={stage.label}
              className={`flex items-center gap-1.5 ${isLast ? "" : "flex-1"}`}
            >
              {/* The markers are decoration; this is the stage as a screen
                  reader gets it, since the label below names only one of the
                  three. */}
              <span className="sr-only">
                {stage.label} —{" "}
                {done
                  ? "done"
                  : failed
                    ? "needs your attention"
                    : current
                      ? "in progress"
                      : "not started"}
              </span>

              <span
                aria-hidden="true"
                className={`grid size-5 shrink-0 place-items-center rounded-full ${
                  done
                    ? "bg-orange-500 text-white"
                    : failed
                      ? "bg-rose-500 text-white"
                      : current
                        ? "bg-orange-50 text-orange-600 ring-4 ring-orange-100"
                        : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : failed ? (
                  <X className="size-3" strokeWidth={3} />
                ) : (
                  <span
                    className={`size-1.5 rounded-full ${current ? "animate-pulse bg-orange-500 motion-reduce:animate-none" : "bg-slate-300"}`}
                  />
                )}
              </span>

              {/* The rail carries the same "everything up to here is done"
                  reading as the vertical tracker's connector. */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded-full ${done ? "bg-orange-500" : "bg-slate-200"}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-2.5 flex items-baseline justify-between gap-3">
        <p
          className={`text-[13px] font-bold leading-4 ${
            activeState === "failed" ? "text-rose-600" : "text-orange-600"
          }`}
        >
          {active.label}
        </p>
        <p className="shrink-0 text-[11px] font-semibold text-slate-400">
          Step {activeIndex + 1} of {STAGES.length}
        </p>
      </div>
    </div>
  );
}

/**
 * One document in the checklist. Shared by the mobile list and the desktop grid
 * so a change to how a flagged document reads lands in both at once.
 *
 * Type steps down a notch from `sm` up: 14/12px is the floor for body text on a
 * phone, while the desktop grid was tuned at 13/11px to fit three columns
 * without wrapping. Same rows, sized for the device holding them.
 */
function DocumentRow({ item, rejection, cleared }) {
  const { icon: Icon, label, detail } = item;

  return (
    <li
      className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 sm:py-2.5 ${
        rejection
          ? "border-rose-200 bg-rose-50/50"
          : "border-slate-200/70 bg-slate-50/70"
      }`}
    >
      <span
        className={`mt-px grid size-7 shrink-0 place-items-center rounded-lg ${
          rejection
            ? "bg-rose-100 text-rose-600"
            : cleared
              ? "bg-emerald-50 text-emerald-600"
              : "bg-white text-slate-400 ring-1 ring-slate-200"
        }`}
      >
        {rejection ? (
          <X className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
        ) : cleared ? (
          <Check className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
        ) : (
          <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0">
        <p
          className={`text-sm font-bold leading-4 sm:text-[13px] ${
            rejection ? "text-rose-700" : "text-slate-800"
          }`}
        >
          {label}
        </p>
        {/* The reason replaces the description — what a document is normally
            checked for stops mattering once you're being told why yours
            failed. */}
        <p
          className={`mt-1 text-xs leading-4 sm:mt-0.5 sm:text-[11px] ${
            rejection ? "text-rose-600" : "text-slate-500"
          }`}
        >
          {rejection ? rejection.reason : detail}
        </p>
      </div>
    </li>
  );
}

/**
 * The checklist on a phone, where five identical rows saying "we're checking
 * this" cost 400px to communicate one bit.
 *
 * Split by whether the row is asking anything of the user. Anything flagged is
 * always open, above the fold of the section and under its own count, because
 * that is the reason the page is being read at all. Everything else — the whole
 * list while pending, the cleared remainder after a rejection — collapses to a
 * single summary row you can open if you want the detail.
 *
 * Nothing is hidden that the user has to act on, which is why this needs no
 * "expanded by default when rejected" state to get right: the flagged rows were
 * never in the collapsible half.
 */
function MobileDocuments({ rejected, verified, rejectionFor }) {
  const [open, setOpen] = useState(false);

  const flagged = rejected
    ? UNDER_REVIEW.filter((item) => rejectionFor(item.id))
    : [];
  const rest = UNDER_REVIEW.filter((item) => !flagged.includes(item));

  // Cleared covers both a full approval and the documents a rejection didn't
  // flag — those passed and shouldn't read as though they're still being
  // looked at.
  const restCleared = verified || rejected;

  const summary = rejected
    ? `${rest.length} other${rest.length === 1 ? "" : "s"} already cleared`
    : verified
      ? `All ${UNDER_REVIEW.length} documents cleared`
      : `${UNDER_REVIEW.length} documents with the reviewer`;

  return (
    <div className="sm:hidden">
      {flagged.length > 0 && (
        <>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-rose-500">
            {flagged.length} document{flagged.length === 1 ? "" : "s"} need
            {flagged.length === 1 ? "s" : ""} fixing
          </h2>
          <ul className="mt-2.5 grid gap-2.5">
            {flagged.map((item) => (
              <DocumentRow key={item.id} item={item} rejection={rejectionFor(item.id)} />
            ))}
          </ul>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-3 text-left transition-colors duration-200 active:bg-slate-100 ${
          flagged.length > 0 ? "mt-2.5" : ""
        }`}
      >
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-lg ${
            restCleared
              ? "bg-emerald-50 text-emerald-600"
              : "bg-white text-slate-400 ring-1 ring-slate-200"
          }`}
        >
          {restCleared ? (
            <Check className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
          ) : (
            <Files className="size-3.5" strokeWidth={2} aria-hidden="true" />
          )}
        </span>

        <span className="min-w-0 flex-1 text-sm font-bold leading-4 text-slate-800">
          {summary}
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul className="mt-2.5 grid gap-2.5">
          {rest.map((item) => (
            <DocumentRow key={item.id} item={item} cleared={restCleared} />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The one thing the page asks of the user, rendered twice: full-width in the
 * mobile action bar, and content-width in the desktop action row. Same
 * component both times so the two can't diverge — a rejection has to send you
 * back into the wizard from either.
 */
function PrimaryAction({ rejected, verified, onClick, className = "" }) {
  return (
    <button
      type="button"
      disabled={!rejected && !verified}
      onClick={onClick}
      className={`group flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100 ${className}`}
    >
      {rejected ? (
        <>
          <PencilLine className="size-4" strokeWidth={2.25} aria-hidden="true" />
          Update my details
        </>
      ) : (
        <>
          Start POSP training
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:translate-x-0"
            aria-hidden="true"
          />
        </>
      )}
    </button>
  );
}

/**
 * VerificationPendingPage — the wait between submitting the onboarding form and
 * being let into training, and the verdict when it lands.
 *
 * The POSP has handed over their documents and a reviewer has to look at them
 * before anything else can happen, so this screen's job is to make the wait
 * legible: what was sent, who has it, roughly how long, and what follows. It is
 * a genuine gate — `RequireFunnel` bounces anyone who tries to skip past it —
 * and the counterpart to `VerificationCompleteCard`, the "verified, start
 * training" screen that opens the training module.
 *
 * Three states off one store value: pending, verified, and rejected. A
 * rejection is the only one that asks anything of the user, so it is the only
 * one that changes the primary action — back into the wizard to fix what was
 * flagged, which on resubmission puts the profile in the queue again.
 *
 * ── Two layouts, not one that stacks ────────────────────────────────────────
 *
 * From `sm` up: two bands, each splitting into two tracks from `lg`, sized to
 * sit inside one laptop viewport without scrolling. There is nothing here worth
 * making someone scroll for, and a waiting screen that runs past the fold reads
 * as more of a wait than it is.
 *
 * Below `sm` that same content stacked to roughly 1400px — three and a half
 * phone screens to say "wait 24 to 48 hours". The mobile layout is therefore
 * built rather than inherited, and re-prioritised around what a phone is for:
 * status first, action always reachable, detail on request.
 *
 *   · the card breaks out of the shell gutters (`-mx-4`) and drops its side
 *     borders, because a rounded box inside a padded shell wastes 32px of a
 *     375px screen and reads as a box in a box
 *   · the status band is tinted by verdict, which is legible before it's read
 *   · the vertical tracker gives way to `StageStrip`
 *   · the checklist gives way to `MobileDocuments`
 *   · the primary action moves into a `sticky bottom-0` bar, the same pattern
 *     the exam runner uses. Sticky rather than fixed so it releases at the end
 *     of the content and the site footer stays reachable
 *   · the breadcrumb and the demo control are desktop-only — neither survives
 *     the cost of a row on a phone
 *
 * That lands at roughly 520px, and the first screen answers status, timing and
 * next action without a scroll.
 *
 * There is no back office to poll yet, so the verdict arrives from the demo
 * control at the foot of the page (or `Approve()` / `Reject()` / `Pending()` in
 * the console). All of them flip the same store the real status call will flip,
 * and because this page subscribes to it, the screen changes in place.
 */
export default function VerificationPendingPage() {
  const navigate = useNavigate();
  const status = useVerificationStore((s) => s.status);
  const rejections = useVerificationStore((s) => s.rejections);
  const approveVerification = useVerificationStore((s) => s.approveVerification);
  const rejectVerification = useVerificationStore((s) => s.rejectVerification);
  const submitForReview = useVerificationStore((s) => s.submitForReview);

  const verified = status === VERIFICATION.VERIFIED;
  const rejected = status === VERIFICATION.REJECTED;
  const ui = STATUS_UI[status] ?? STATUS_UI[VERIFICATION.PENDING];
  const StatusIcon = ui.icon;

  /** The reason this document was sent back, or undefined if it was fine. */
  const rejectionFor = (id) =>
    rejected ? rejections.find((entry) => entry.id === id) : undefined;

  /**
   * Where each stage stands. Stage 1 is always behind us here; stage 2 carries
   * the verdict; stage 3 only goes live once the profile is cleared.
   */
  const stageState = (index) => {
    if (index === 0) return "done";
    if (index === 1) {
      if (verified) return "done";
      if (rejected) return "failed";
      return "current";
    }
    return verified ? "current" : "upcoming";
  };

  /** A rejection is the only verdict that sends you somewhere else. */
  const onPrimaryAction = () =>
    navigate(rejected ? "/onboarding" : "/posp-training");

  const actionCaption = rejected
    ? "Resubmitting puts you back in the review queue."
    : "Unlocks as soon as your profile is approved.";

  const supportPrompt = rejected
    ? "Think this is a mistake?"
    : "Waiting more than two working days?";

  const DEMO_STATES = [
    { label: "Pending", value: VERIFICATION.PENDING, apply: submitForReview },
    { label: "Verified", value: VERIFICATION.VERIFIED, apply: approveVerification },
    { label: "Rejected", value: VERIFICATION.REJECTED, apply: () => rejectVerification() },
  ];

  return (
    <FunnelLayout header="auto">
      {/* Tighter vertical padding than the wizard — this page is sized to sit
          inside one viewport, and the shared shell only carries the width. */}
      <div className={`${FUNNEL_SHELL} py-4 lg:py-5`}>
          {/* ── Chrome ───────────────────────────────────────────────────
              Desktop gets the full trail up the funnel. Onboarding is a real
              route gated only on sign-in, so a waiting user can genuinely
              return and review what they submitted.

              A phone gets the same destination as one back link. The trail
              plus the button wrapped to two rows and took ~100px of the first
              screen to offer a route nobody takes mid-funnel on a phone. */}
          <div className="anim-fade mb-3 hidden flex-wrap items-center justify-between gap-3 sm:flex">
            <Breadcrumb
              items={[
                { label: "Home", href: "https://www.letsinsurance.com/", icon: Home },
                { label: "On Boarding", to: "/onboarding" },
                { label: "Verification" },
              ]}
            />

            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:border-orange-200 hover:text-orange-600"
            >
              <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
              Back to my details
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="anim-fade -ml-1.5 mb-2 inline-flex items-center gap-1 rounded-lg px-1.5 py-2 text-sm font-semibold text-slate-500 sm:hidden"
          >
            <ChevronLeft size={16} strokeWidth={2.25} aria-hidden="true" />
            Back to my details
          </button>

          <section
            aria-labelledby="verification-heading"
            className="anim-fade-d1 -mx-4 overflow-hidden border-y border-slate-200/80 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.25)] sm:mx-0 sm:rounded-2xl sm:border-x"
          >
            {/* ── Band 1: status, with the journey tracker alongside ─── */}
            {/* The tracker moves into its own track from lg rather than sitting
                under the status, which is where most of the old height went. */}
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

                {/* Icon beside the heading rather than stacked above it — the
                    centred column version cost ~100px of pure vertical run. */}
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

              <div className="hidden sm:block lg:border-l lg:border-slate-100 lg:pl-10">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  What happens next
                </h2>
                <ol className="mt-3.5">
                  {STAGES.map((stage, index) => (
                    <Stage
                      key={stage.label}
                      stage={stage}
                      state={stageState(index)}
                      isLast={index === STAGES.length - 1}
                    />
                  ))}
                </ol>
              </div>
            </div>

            {/* The mobile trail, in its own row rather than inside the status
                band — it is a different shape, not a reflow of the same one. */}
            <StageStrip stageState={stageState} />

            {/* ── Band 2: the documents, plus support ────────────────── */}
            <div className="p-4 sm:p-6">
              {/* Desktop keeps a heading over the grid. On mobile the summary
                  row says the same thing in the same place, so a heading above
                  it would only echo it. */}
              <h2 className="hidden text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:block">
                {ui.checklistHeading}
              </h2>

              <MobileDocuments
                rejected={rejected}
                verified={verified}
                rejectionFor={rejectionFor}
              />

              {/* Three across from lg turns five rows into two, which is the
                  other half of the height saving. */}
              <ul className="mt-3.5 hidden gap-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {UNDER_REVIEW.map((item) => {
                  const rejection = rejectionFor(item.id);
                  // Cleared covers both a full approval and the documents a
                  // rejection didn't flag — those passed and shouldn't read as
                  // though they're still being looked at.
                  const cleared = verified || (rejected && !rejection);

                  return (
                    <DocumentRow
                      key={item.id}
                      item={item}
                      rejection={rejection}
                      cleared={cleared}
                    />
                  );
                })}

                {/* Support rides in the sixth cell rather than as its own strip
                    — five items across three columns leave it empty anyway. */}
                <li className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                  <Headset
                    className="mt-0.5 size-4 shrink-0 text-slate-400"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <p className="min-w-0 text-[11px] leading-4 text-slate-500">
                    {supportPrompt} Write to{" "}
                    <span className="font-semibold text-slate-700">{SUPPORT_EMAIL}</span>{" "}
                    with your registered mobile number.
                  </p>
                </li>
              </ul>

              {/* On a phone the address is a tap, not something to copy out by
                  hand — the subject line carries what the desktop copy asks
                  them to include. */}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("POSP verification help")}`}
                className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-3 sm:hidden"
              >
                <Headset
                  className="size-4 shrink-0 text-slate-400"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 text-xs leading-4 text-slate-500">
                  {supportPrompt}{" "}
                  <span className="font-semibold text-slate-700">Email support</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-slate-300" aria-hidden="true" />
              </a>
            </div>
          </section>

          {/* ── Action row, desktop ──────────────────────────────────── */}
          <div className="anim-fade-d2 mt-4 hidden items-center justify-between gap-3 sm:flex">
            {/* Demo control — stands in for the back office until there is one.
                Delete this block when a real status call lands; nothing else
                depends on it, because each button only calls the same store
                action that call will.

                Desktop-only: it is scaffolding, and on a phone it was a
                wrapping full-width row of it. `Approve()` / `Reject()` /
                `Pending()` still work from a remote console if a verdict has
                to be flipped while testing on a device. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-slate-300 bg-white/60 px-3.5 py-2.5">
              <p className="text-[11px] font-bold leading-4 text-slate-600">Demo control</p>
              <div className="flex items-center gap-1">
                {DEMO_STATES.map(({ label, value, apply }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={apply}
                    aria-pressed={status === value}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors duration-200 ${
                      status === value
                        ? "bg-slate-800 text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <PrimaryAction
                rejected={rejected}
                verified={verified}
                onClick={onPrimaryAction}
              />

              {/* Nothing to say once they're through — the live button speaks
                  for itself, and a caption under it would only add noise. */}
              {!verified && <p className="text-[11px] text-slate-400">{actionCaption}</p>}
            </div>
          </div>

          {/* ── Action bar, mobile ───────────────────────────────────────
              Sticky rather than fixed: it pins to the bottom of the viewport
              for the whole scroll of the content and then releases at the end
              of it, so the site footer below is still reachable and needs no
              spacer. Breaks the shell gutters to sit edge to edge, and pads
              past the home indicator on the phones that have one. */}
          <div className="sticky bottom-0 z-10 -mx-4 mt-3 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
            {!verified && (
              <p className="mb-2 text-center text-xs text-slate-400">{actionCaption}</p>
            )}

            <PrimaryAction
              rejected={rejected}
              verified={verified}
              onClick={onPrimaryAction}
              className="w-full"
            />
          </div>
      </div>
    </FunnelLayout>
  );
}
