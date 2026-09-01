import { useCallback, useEffect, useState } from "react";
import AppLink from "@/shared/components/AppLink";
import { fetchMyCertificate } from "@/features/posp-training/api/certificateApi";
import { formatLongDate } from "../lib/profileFields";

const CARD =
  "w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6";

const HEADING = "text-xs font-bold uppercase tracking-widest text-orange-600";

const ACTION =
  "flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.98] transition-all duration-300 text-sm font-semibold";

const PILL =
  "inline-block px-2.5 py-1 rounded-full text-status-pill font-bold uppercase tracking-wide";

const SHEET =
  "relative shrink-0 w-20 aspect-[210/297] rounded-md bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden";

const SPLIT = "mt-4 flex items-start gap-3";

const statusOf = (certificate) => {
  if (certificate.expired)
    return { label: "Expired", pill: "text-rose-600 bg-rose-50" };
  if (certificate.active)
    return { label: "Active", pill: "text-emerald-600 bg-emerald-50" };
  return { label: "Inactive", pill: "text-amber-600 bg-amber-50" };
};

const onDate = (stamp) => (stamp ? formatLongDate(new Date(stamp)) : null);

function useMyCertificate() {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    (isLive = () => true) =>
      fetchMyCertificate()
        .then((issued) => {
          if (!isLive()) return;
          setCertificate(issued);
          setError(null);
        })
        .catch((err) => {
          if (!isLive()) return;
          setCertificate(null);
          setError(err);
        })
        .finally(() => {
          if (isLive()) setLoading(false);
        }),
    [],
  );

  useEffect(() => {
    let live = true;
    load(() => live);

    return () => {
      live = false;
    };
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    return load();
  }, [load]);

  return { certificate, loading, error, retry };
}

function MiniSheet({ className = "" }) {
  return (
    <div className={`${SHEET} ${className}`} aria-hidden="true">
      <div className="absolute inset-1 border border-[#c5a059]" />
      <div className="absolute inset-2 border border-[#c5a059]/40" />

      <div className="absolute inset-0 flex flex-col items-center px-5 pt-4 pb-3">
        <div className="h-1 w-7 rounded-full bg-[#0b1b3d]" />
        <div className="mt-1.5 h-px w-4 bg-[#c5a059]" />

        <div className="mt-3 w-full space-y-1">
          <div className="h-px w-full bg-slate-200" />
          <div className="h-px w-full bg-slate-200" />
          <div className="h-px w-2/3 bg-slate-200" />
        </div>

        <div className="mt-auto flex w-full items-center justify-between">
          <div className="h-px w-4 bg-slate-200" />
          <div className="size-2 rounded-full border border-[#c5a059]" />
          <div className="h-px w-4 bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  if (!value) return null;

  return (
    <div>
      <dt className="text-field-label uppercase tracking-wide text-slate-400 font-semibold">
        {label}
      </dt>
      <dd
        className={`text-sm font-semibold text-slate-700 wrap-break-word ${mono ? "font-data-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

const CertificatePreviewBox = () => {
  const { certificate, loading, error, retry } = useMyCertificate();

  if (loading) {
    return (
      <div className={`${CARD} animate-pulse`} aria-hidden="true">
        <div className="flex items-center justify-between gap-3">
          <div className="h-3 w-28 rounded bg-slate-100" />
          <div className="h-5 w-14 rounded-full bg-slate-100" />
        </div>
        <div className={SPLIT}>
          <div className={`${SHEET} ring-0 shadow-none bg-slate-100`} />
          <div className="flex-1 min-w-0 space-y-3">
            <div className="h-8 w-full rounded bg-slate-100" />
            <div className="h-8 w-3/4 rounded bg-slate-100" />
            <div className="h-8 w-3/4 rounded bg-slate-100" />
          </div>
        </div>
        <div className="mt-5 h-9 w-full rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={CARD}>
        <p className={HEADING}>POSP Certificate</p>
        <p className="mt-3 text-sm text-slate-500 font-medium">
          {error.message || "The server didn’t answer. Please try again."}
        </p>
        <button type="button" onClick={retry} className={`${ACTION} mt-4`}>
          Try again
        </button>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className={CARD}>
        <p className={HEADING}>POSP Certificate</p>
        <div className={SPLIT}>
          <MiniSheet className="opacity-40" />
          <p className="flex-1 min-w-0 text-sm text-slate-500 font-medium">
            Not issued yet — it appears here once you’ve passed the POSP exam.
          </p>
        </div>
        <AppLink to="/posp-training" className={`${ACTION} mt-5`}>
          Go to training
        </AppLink>
      </div>
    );
  }

  const status = statusOf(certificate);

  return (
    <div className={`card-lift ${CARD}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={HEADING}>POSP Certificate</p>
        <span className={`${PILL} ${status.pill} shrink-0`}>
          {status.label}
        </span>
      </div>

      <div className={SPLIT}>
        <MiniSheet />

        <dl className="flex-1 min-w-0 space-y-3">
          <Row label="Certificate No." value={certificate.number} mono />
          <Row label="Issued" value={onDate(certificate.issuedAt)} />
          <Row
            label={certificate.expired ? "Expired on" : "Valid until"}
            value={onDate(certificate.expiresAt)}
          />
        </dl>
      </div>

      <AppLink to="/certificate" className={`${ACTION} mt-5`}>
        View certificate
      </AppLink>
    </div>
  );
};

export default CertificatePreviewBox;
