import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  ChevronLeft,
  CreditCard,
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
 */
const STATUS_UI = {
  [VERIFICATION.PENDING]: {
    badge: "Under review",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
    dotClass: "animate-pulse bg-amber-500 motion-reduce:animate-none",
    icon: ShieldCheck,
    iconClass: "bg-orange-50 text-orange-500 ring-orange-100",
    heading: "Your profile is with our team",
    copy: "A reviewer is checking your documents now. This usually takes 24 to 48 working hours, and we'll notify you the moment it's done — you don't need to keep this page open.",
    checklistHeading: "With the reviewer",
  },
  [VERIFICATION.VERIFIED]: {
    badge: "Verified",
    badgeClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    dotClass: "bg-emerald-500",
    icon: BadgeCheck,
    iconClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    heading: "Your profile has been verified",
    copy: "Everything checked out. Your 15-hour POSP training programme is open — start whenever you're ready.",
    checklistHeading: "Checked and cleared",
  },
  [VERIFICATION.REJECTED]: {
    badge: "Action needed",
    badgeClass: "bg-rose-50 text-rose-600 ring-rose-100",
    dotClass: "bg-rose-500",
    icon: ShieldAlert,
    iconClass: "bg-rose-50 text-rose-600 ring-rose-100",
    heading: "A few things need fixing",
    copy: "Our reviewer couldn't clear everything. Update the details flagged below and send your application back — the rest of your profile is already accepted, so you only need to fix what's marked.",
    checklistHeading: "Needs your attention",
  },
};

/**
 * One stage in the tracker. `state` is 'done' | 'current' | 'failed' |
 * 'upcoming', which drives the marker, the rail below it and the weight of the
 * label.
 *
 * Runs vertically at every width. It sits in the narrow right-hand track of the
 * status band, where a horizontal trail would wrap "Application submitted" onto
 * two lines and cost more height than the stacked version it replaced.
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
 * Laid out to sit inside one laptop viewport without scrolling: two bands, each
 * splitting into two tracks from `lg` up. There is nothing here worth making
 * someone scroll for, and a waiting screen that runs past the fold reads as
 * more of a wait than it is.
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
          {/* Breadcrumb — the way back up the funnel. Onboarding is a real
              route gated only on sign-in, so a waiting user can
              genuinely return and review what they submitted. */}
          <div className="anim-fade mb-3 flex flex-wrap items-center justify-between gap-3">
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

          <section
            aria-labelledby="verification-heading"
            className="anim-fade-d1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.25)]"
          >
            {/* ── Band 1: status, with the journey tracker alongside ─── */}
            {/* The tracker moves into its own track from lg rather than sitting
                under the status, which is where most of the old height went. */}
            <div className="grid gap-6 border-b border-slate-100 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-center lg:gap-12">
              <div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ring-1 ${ui.badgeClass}`}
                >
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${ui.dotClass}`} />
                  {ui.badge}
                </span>

                {/* Icon beside the heading rather than stacked above it — the
                    centred column version cost ~100px of pure vertical run. */}
                <div className="mt-3 flex items-center gap-3.5">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-full ring-1 ${ui.iconClass}`}
                  >
                    <StatusIcon className="size-6" strokeWidth={2} aria-hidden="true" />
                  </span>

                  <h1
                    id="verification-heading"
                    className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
                  >
                    {ui.heading}
                  </h1>
                </div>

                <p className="mt-2.5 max-w-xl text-[13px] leading-5 text-slate-500">{ui.copy}</p>
              </div>

              <div className="lg:border-l lg:border-slate-100 lg:pl-10">
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

            {/* ── Band 2: the documents, plus support ────────────────── */}
            <div className="p-5 sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {ui.checklistHeading}
              </h2>

              {/* Three across from lg turns five rows into two, which is the
                  other half of the height saving. */}
              <ul className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {UNDER_REVIEW.map(({ id, icon: Icon, label, detail }) => {
                  const rejection = rejectionFor(id);
                  // Cleared covers both a full approval and the documents a
                  // rejection didn't flag — those passed and shouldn't read as
                  // though they're still being looked at.
                  const cleared = verified || (rejected && !rejection);

                  return (
                    <li
                      key={id}
                      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${
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
                          className={`text-[13px] font-bold leading-4 ${
                            rejection ? "text-rose-700" : "text-slate-800"
                          }`}
                        >
                          {label}
                        </p>
                        {/* The reason replaces the description — what a
                            document is normally checked for stops mattering
                            once you're being told why yours failed. */}
                        <p
                          className={`mt-0.5 text-[11px] leading-4 ${
                            rejection ? "text-rose-600" : "text-slate-500"
                          }`}
                        >
                          {rejection ? rejection.reason : detail}
                        </p>
                      </div>
                    </li>
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
                    {rejected ? "Think this is a mistake? Write to " : "Waiting more than two working days? Write to "}
                    <span className="font-semibold text-slate-700">
                      support@letsinsurance.com
                    </span>{" "}
                    with your registered mobile number.
                  </p>
                </li>
              </ul>
            </div>
          </section>

          {/* ── Action row ───────────────────────────────────────────── */}
          <div className="anim-fade-d2 mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Demo control — stands in for the back office until there is one.
                Delete this block when a real status call lands; nothing else
                depends on it, because each button only calls the same store
                action that call will. */}
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

            {/* A rejection is the only verdict that asks something of the user,
                so it is the only one that changes the primary action. */}
            <div className="flex flex-col items-end gap-1.5">
              {rejected ? (
                <button
                  type="button"
                  onClick={() => navigate("/onboarding")}
                  className="group flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98]"
                >
                  <PencilLine className="size-4" strokeWidth={2.25} aria-hidden="true" />
                  Update my details
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!verified}
                  onClick={() => navigate("/posp-training")}
                  className="group flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100"
                >
                  Start POSP training
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:translate-x-0"
                    aria-hidden="true"
                  />
                </button>
              )}

              {/* Nothing to say once they're through — the live button speaks
                  for itself, and a caption under it would only add noise. */}
              {!verified && (
                <p className="text-[11px] text-slate-400">
                  {rejected
                    ? "Resubmitting puts you back in the review queue."
                    : "Unlocks as soon as your profile is approved."}
                </p>
              )}
            </div>
          </div>
      </div>
    </FunnelLayout>
  );
}
