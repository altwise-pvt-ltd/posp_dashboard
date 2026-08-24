import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { verifyForTraining } from "@/features/posp-training/api/trainingApi";
import FunnelLayout from "@/shared/layouts/FunnelLayout";
import { showAlert } from "@/shared/store/alertStore";
import {
  acknowledgeVerification,
  useVerificationStore,
  VERIFICATION,
} from "@/shared/store/verificationStore";
import DocumentChecklist from "../components/DocumentChecklist";
import MobileDocuments from "../components/MobileDocuments";
import PrimaryAction from "../components/PrimaryAction";
import StageStrip from "../components/StageStrip";
import StatusBand from "../components/StatusBand";
import StatusRefresh from "../components/StatusRefresh";
import { useVerificationStatus } from "../hooks/useVerificationStatus";
import {
  buildDocumentStates,
  stageStateFor,
  statusUiFor,
} from "../model/verificationContent";
const VERIFICATION_SHELL =
  "mx-auto box-border w-full max-w-5xl px-4 sm:px-6 lg:px-10 xl:px-14 2xl:max-w-320";

export default function VerificationPendingPage() {
  const navigate = useNavigate();
  // The verdict, live from the server. `rejections` stays local — the API says
  // *that* a profile was sent back, not what was wrong.
  const { status, loading, error, check } = useVerificationStatus();
  const rejections = useVerificationStore((s) => s.rejections);

  const verified = status === VERIFICATION.VERIFIED;
  const rejected = status === VERIFICATION.REJECTED;
  const pending = !verified && !rejected;
  const ui = statusUiFor(status);

  /** Every document paired with its verdict, built once for both lists. */
  const documents = useMemo(
    () => buildDocumentStates(status, rejections),
    [status, rejections],
  );

  const stageState = (index) => stageStateFor(status, index);

  const [starting, setStarting] = useState(false);

  /**
   * Rejected sends them back to the wizard. Otherwise the LMS gets asked first:
   * an approved profile is not the same as a seat on the course, and it is the
   * server that clears the POSP to begin. Only once it does is the verification
   * screen acknowledged — a failed call has to leave them here to retry, not on
   * a training page they were never let into.
   */
  const onPrimaryAction = async () => {
    if (rejected) {
      navigate("/onboarding");
      return;
    }

    setStarting(true);
    try {
      const { redirectUrl } = await verifyForTraining();

      acknowledgeVerification();

      // The course may live on the LMS's own domain; `window.location` rather
      // than `navigate`, since the router knows nothing about that origin.
      if (redirectUrl) window.location.assign(redirectUrl);
      else navigate("/posp-training");
    } catch (err) {
      setStarting(false);
      showAlert({
        variant: "error",
        title: "Couldn't open your training",
        message: err.message,
      });
    }
  };

  // `brand`, not the onboarding bar: this page is past the wizard, so it carries
  // the account menu and stays put rather than hiding on scroll.
  return (
    <FunnelLayout header="brand">
      {/* Tighter vertical padding than the wizard — this page is sized to sit
          inside one viewport, and the shell only carries the width. */}
      <div className={`${VERIFICATION_SHELL} py-4 lg:py-5`}>
        <section
          aria-labelledby="verification-heading"
          className="anim-fade-d1 -mx-4 overflow-hidden border-y border-slate-200/80 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.25)] sm:mx-0 sm:rounded-2xl sm:border-x"
        >
          {/* ── Band 1: status, with the journey tracker alongside ─── */}
          <StatusBand ui={ui} stageState={stageState} />

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
              documents={documents}
              rejected={rejected}
              verified={verified}
              supportPrompt={ui.supportPrompt}
            />

            <DocumentChecklist
              documents={documents}
              supportPrompt={ui.supportPrompt}
            />

            {/* The mobile action bar below is sticky and already tight, so the
                refresh control sits at the end of the content instead. */}
            {pending && (
              <div className="mt-5 flex justify-center border-t border-slate-100 pt-4 sm:hidden">
                <StatusRefresh
                  loading={loading}
                  error={error}
                  onRefresh={check}
                />
              </div>
            )}
          </div>
        </section>

        {/* ── Action row, desktop ──────────────────────────────────────
            While a verdict is pending the refresh control holds the left edge
            and the action the right; once decided there is nothing left to
            re-check, so the action is the only thing in the row. */}
        <div
          className={`anim-fade-d2 mt-4 hidden items-center gap-3 sm:flex ${
            pending ? "justify-between" : "justify-end"
          }`}
        >
          {pending && (
            <StatusRefresh loading={loading} error={error} onRefresh={check} />
          )}

          <div className="flex flex-col items-end gap-1.5">
            <PrimaryAction
              rejected={rejected}
              verified={verified}
              busy={starting}
              onClick={onPrimaryAction}
            />

            {/* Nothing to say once they're through — the live button speaks
                for itself, and a caption under it would only add noise. */}
            {!verified && (
              <p className="text-[11px] text-slate-400">{ui.actionCaption}</p>
            )}
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
            <p className="mb-2 text-center text-xs text-slate-400">
              {ui.actionCaption}
            </p>
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
