import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FunnelLayout, { FUNNEL_SHELL } from "@/shared/layouts/FunnelLayout";
import {
  useVerificationStore,
  VERIFICATION,
} from "@/shared/store/verificationStore";
import DemoStatusControl from "../components/DemoStatusControl";
import DocumentChecklist from "../components/DocumentChecklist";
import MobileDocuments from "../components/MobileDocuments";
import PrimaryAction from "../components/PrimaryAction";
import StageStrip from "../components/StageStrip";
import StatusBand from "../components/StatusBand";
import VerificationChrome from "../components/VerificationChrome";
import {
  buildDocumentStates,
  stageStateFor,
  statusUiFor,
} from "../model/verificationContent";
export default function VerificationPendingPage() {
  const navigate = useNavigate();
  const status = useVerificationStore((s) => s.status);
  const rejections = useVerificationStore((s) => s.rejections);

  const verified = status === VERIFICATION.VERIFIED;
  const rejected = status === VERIFICATION.REJECTED;
  const ui = statusUiFor(status);

  /** Every document paired with its verdict, built once for both lists. */
  const documents = useMemo(
    () => buildDocumentStates(status, rejections),
    [status, rejections]
  );

  const stageState = (index) => stageStateFor(status, index);

  const goBack = () => navigate("/onboarding");

  /** A rejection is the only verdict that sends you somewhere else. */
  const onPrimaryAction = () =>
    navigate(rejected ? "/onboarding" : "/posp-training");

  return (
    <FunnelLayout header="auto">
      {/* Tighter vertical padding than the wizard — this page is sized to sit
          inside one viewport, and the shared shell only carries the width. */}
      <div className={`${FUNNEL_SHELL} py-4 lg:py-5`}>
        <VerificationChrome onBack={goBack} />

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
          </div>
        </section>

        {/* ── Action row, desktop ──────────────────────────────────── */}
        <div className="anim-fade-d2 mt-4 hidden items-center justify-between gap-3 sm:flex">
          <DemoStatusControl />

          <div className="flex flex-col items-end gap-1.5">
            <PrimaryAction
              rejected={rejected}
              verified={verified}
              onClick={onPrimaryAction}
            />

            {/* Nothing to say once they're through — the live button speaks
                for itself, and a caption under it would only add noise. */}
            {!verified && <p className="text-[11px] text-slate-400">{ui.actionCaption}</p>}
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
            <p className="mb-2 text-center text-xs text-slate-400">{ui.actionCaption}</p>
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
