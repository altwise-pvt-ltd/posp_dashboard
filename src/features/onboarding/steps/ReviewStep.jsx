import { useState, useEffect, useMemo } from "react";
import {
  CreditCard, Mail, Fingerprint, Camera, Landmark, GraduationCap, Building2,
  Pencil, X, FileText, CheckCircle2, ShieldCheck, Send, AlertCircle, RotateCcw, Loader2,
} from "lucide-react";
import Button from "@/shared/components/Button";
import { fetchReviewDetails, fetchDocumentBlob } from "../api/onboardingApi";
import PanStep from "./PanStep";
import EmailStep from "./EmailStep";
import AadhaarStep from "./AadhaarStep";
import SelfieStep from "./SelfieStep";
import BankStep from "./BankStep";
import EducationStep from "./EducationStep";
import BusinessStep from "./BusinessStep";

/* Display helpers — keep the saved (clean) values, format only for reading. */
const formatAadhaar = (digits = "") => digits.replace(/(.{4})/g, "$1 ").trim();
const maskAccount = (n = "") => (n.length > 4 ? `•••• •••• ${n.slice(-4)}` : n);

/**
 * A masters value → something readable. `POST_GRADUATE` → "Post Graduate".
 *
 * This replaces two hardcoded label maps that had gone stale in exactly the way
 * the masters endpoints exist to prevent — they still spelled the values
 * `Graduate` and `savings`, so every account type and most qualifications fell
 * through to showing the raw server string.
 *
 * Derived rather than fetched: the review screen would otherwise pull all three
 * masters lists purely to translate values it is only displaying. Short tokens
 * are left uppercase so acronyms survive — SSC, HSC and LLP would otherwise
 * read as "Ssc", "Hsc" and "Llp".
 *
 * Display only. Nothing submitted is ever derived from this — the stored value
 * is always the server's own.
 */
const humanizeValue = (value = "") =>
  String(value)
    .split("_")
    .filter(Boolean)
    .map((word) =>
      word.length <= 3
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");

/**
 * One config object per section drives both the read-only summary and the
 * inline editor:
 *   rows(d)  → [ [label, value], ... ]   text fields to list
 *   files(d) → [ [label, source], ... ]  documents to thumbnail
 *   Editor   → the step component, reused as-is with initialValues + onNext
 *
 * A file `source` is either a `File` this sitting uploaded or a document key
 * string from `GET /onboarding/review`. Each `files()` prefers the File — it
 * needs no request and is the freshest thing we have — and falls back to the
 * key, which is all a returning user's session has.
 */
const SECTIONS = [
  {
    key: "pan",
    title: "PAN Details",
    Icon: CreditCard,
    Editor: PanStep,
    rows: (d) => [
      ["PAN Number", d.panNumber],
      ["Full Name", d.fullName],
      ["Date of Birth", d.dateOfBirth || "—"],
    ],
    /* The back is listed only when one exists — no step uploads it, so for most
       applications there is nothing there to show. */
    files: (d) => [
      ["PAN Card", d.panFrontImage ?? d.panFrontImageKey],
      ...(d.panBackImageKey ? [["PAN Card (Back)", d.panBackImageKey]] : []),
    ],
  },
  {
    key: "email",
    title: "Email",
    Icon: Mail,
    Editor: EmailStep,
    rows: (d) => [["Email Address", d.email]],
  },
  {
    key: "aadhaar",
    title: "Aadhaar Details",
    Icon: Fingerprint,
    Editor: AadhaarStep,
    /* DOB / gender / address are on the record but collected by no step, so
       they are listed only when the server actually holds them — otherwise
       every applicant gets three permanent "—" rows for fields we never ask
       for. */
    rows: (d) => [
      ["Aadhaar Number", formatAadhaar(d.aadhaar)],
      ["Name", d.fullName],
      ...(d.dateOfBirth ? [["Date of Birth", d.dateOfBirth]] : []),
      ...(d.gender ? [["Gender", d.gender]] : []),
      ...(d.address ? [["Address", d.address]] : []),
    ],
    files: (d) => [
      ["Aadhaar Front", d.aadhaarFrontImage ?? d.aadhaarFrontImageKey],
      ["Aadhaar Back", d.aadhaarBackImage ?? d.aadhaarBackImageKey],
    ],
  },
  {
    key: "selfie",
    title: "Selfie",
    Icon: Camera,
    Editor: SelfieStep,
    rows: () => [],
    files: (d) => [["Selfie", d.selfie ?? d.selfieKey]],
  },
  {
    key: "bank",
    title: "Bank Account",
    Icon: Landmark,
    Editor: BankStep,
    rows: (d) => [
      ["Account Type", humanizeValue(d.accountType)],
      ["Account Holder", d.accountHolder],
      ["Account Number", maskAccount(d.accountNumber)],
      ["IFSC Code", d.ifsc],
      ["Bank Name", d.bankName],
    ],
    files: (d) => [
      ["Passbook", d.passbookImage ?? d.passbookImageKey],
      ["Cancelled Cheque", d.chequeImage ?? d.chequeImageKey],
    ],
  },
  {
    key: "education",
    title: "Education",
    Icon: GraduationCap,
    Editor: EducationStep,
    rows: (d) => [
      ["Highest Qualification", humanizeValue(d.highestQualification)],
      ["Institution", d.institutionName || "—"],
      ["Board / University", d.boardOrUniversity || "—"],
      ["Passing Year", d.passingYear || "—"],
    ],
    files: (d) => [["Certificate", d.certificateImage ?? d.certificateImageKey]],
  },
  {
    key: "business",
    title: "Business",
    Icon: Building2,
    Editor: BusinessStep,
    rows: (d) => [
      ["Business Type", humanizeValue(d.businessType)],
      ["Business Name", d.businessName],
      ["Address", [d.addressLine1, d.addressLine2, d.city, d.state, d.pincode].filter(Boolean).join(", ")],
      ["GSTIN", d.gstIn || "—"],
    ],
    files: () => [],
  },
];

/* Shared little "Edit" pill — same affordance the section cards use today. */
function EditPill({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 transition-all duration-150 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600 active:scale-[0.97]"
    >
      <Pencil size={12} strokeWidth={2.5} /> Edit
    </button>
  );
}

/** True for anything we can turn into an object URL without a request. */
const isBlob = (source) => source instanceof Blob;
/** True for a document key from the review response. */
const isKey = (source) => typeof source === "string" && source.length > 0;
/** Anything renderable at all — a File to hand, or a key we can fetch. */
const hasDocument = (source) => isBlob(source) || isKey(source);

/**
 * A displayable URL for a document, whichever form we hold it in.
 *
 * Two sources converge here. A `File` from this sitting is already local, so it
 * becomes an object URL during render and paints immediately. A document key
 * from `GET /onboarding/review` is a server-side reference, so the bytes are
 * fetched first — through the axios client, because the route is authenticated
 * and a bare `<img src>` would carry no bearer token and simply 401.
 *
 * The URL is derived with `useMemo` rather than pushed into state, so the local
 * case costs no extra render; only the fetched blob needs state, and it is set
 * from a promise callback rather than the effect body.
 *
 * A failed fetch resolves to no URL, which the callers already render as the
 * generic file icon — a missing thumbnail is a much smaller problem than a
 * review screen that errors out over one image.
 */
function useDocumentUrl(source) {
  const key = isKey(source) ? source : null;
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;

    fetchDocumentBlob(key)
      .then((blob) => {
        if (!cancelled) setFetched(blob);
      })
      .catch(() => {
        if (!cancelled) setFetched(null);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  const blob = isBlob(source) ? source : fetched;

  const url = useMemo(
    () => (blob instanceof Blob ? URL.createObjectURL(blob) : null),
    [blob]
  );

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  // A fetched blob carries its real content type; a key alone tells us nothing
  // until the bytes arrive, so "is it an image?" is answered from the blob.
  return { url, isImage: Boolean(blob?.type?.startsWith("image/")) };
}

/** What to caption a document with — a File has a name, a fetched blob doesn't. */
const documentName = (source) => (source instanceof File && source.name) || "Uploaded";

/* ── A single uploaded file: image thumbnail, or a labelled chip for PDFs ── */
function FilePreview({ label, source }) {
  const { url, isImage } = useDocumentUrl(source);

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
        {isImage && url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <FileText size={18} className="text-slate-400" />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="truncate text-[0.75rem] font-medium text-slate-600">{documentName(source)}</div>
      </div>
    </div>
  );
}

/* ── Read-only summary for one section (mobile / tablet card) ── */
function SummaryCard({ section, data, onEdit }) {
  const { title, Icon } = section;
  const rows = section.rows(data);
  const files = (section.files?.(data) || []).filter(([, source]) => hasDocument(source));

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
          <Icon size={15} className="text-orange-500" strokeWidth={2.5} />
          {title}
        </span>
        <EditPill onClick={onEdit} />
      </div>

      <div className="px-4 py-3.5">
        <dl className="grid grid-cols-1 gap-y-2.5">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[120px_1fr] gap-3 items-baseline">
              <dt className="text-[0.75rem] font-medium text-slate-400">{label}</dt>
              <dd className="text-[0.8125rem] font-semibold text-slate-700 break-words">{value || "—"}</dd>
            </div>
          ))}
        </dl>

        {files.length > 0 && (
          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map(([label, source]) => (
              <FilePreview key={label} label={label} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════ DESKTOP (xl+) — profile-style 3-zone view ════════════════════ */

/* LEFT rail — the selfie becomes the applicant's avatar (mirrors ProfileCard). */
function IdentityRail({ data, review }) {
  const selfie = data.selfie?.selfie ?? data.selfie?.selfieKey;
  const name = data.pan?.fullName || data.aadhaar?.fullName || "Your Application";

  /**
   * The server's per-section `isCompleted` when we have it, and a look at the
   * values themselves when we don't.
   *
   * The server's answer is the better one — it reflects what passed validation
   * on save, not merely what this browser has a value for — so the local count
   * is only the fallback for a review call that failed.
   */
  const completed = review
    ? SECTIONS.filter((s) => review.completion[s.key]).length
    : SECTIONS.filter((s) => {
        const d = data[s.key];
        return d && Object.values(d).some((v) => v !== "" && v != null && v !== false);
      }).length;

  /* Was a hardcoded "Ready", which was a guess dressed as a fact — the server
     reports the real one (`REVIEW_PENDING` → "Review Pending"). */
  const status = review?.overallStatus ? humanizeValue(review.overallStatus) : "In Progress";

  const { url } = useDocumentUrl(selfie);

  return (
    <aside className="w-56 shrink-0 sticky top-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Avatar — square crop keeps a headshot centered (no face clipping) */}
        <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
          {url ? (
            <img src={url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Camera size={32} className="text-slate-300" strokeWidth={1.5} />
            </div>
          )}
          {/* subtle fade so the image bleeds into the white content below */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-white to-transparent pointer-events-none" />
        </div>

        {/* Identity */}
        <div className="px-5 pb-5 pt-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1">
            Applicant
          </p>
          <h3 className="text-base font-bold text-slate-800 leading-tight break-words">
            {name}
          </h3>
          {/* The number they signed in with. It is on the review response and
              had nowhere else to appear — and it belongs with the identity
              rather than in a section, since nothing here can edit it. */}
          {review?.mobile && (
            <p className="mt-0.5 text-xs font-medium text-slate-400">+91 {review.mobile}</p>
          )}

          {/* Stats with vertical divider */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-around">
            <div className="text-center">
              <span className="block text-base font-bold text-slate-700">
                {completed}/{SECTIONS.length}
              </span>
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wide">
                Sections
              </span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="text-center">
              <span className="block text-sm font-bold text-emerald-600 leading-tight">
                {status}
              </span>
              <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wide">
                Status
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* Boxed label/value chip — same scannable field style as PersonalInfoCard. */
function Field({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2.5">
      <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
        {label}
      </span>
      <span className="block text-sm font-semibold text-slate-700 break-words">
        {value || "—"}
      </span>
    </div>
  );
}

/* MIDDLE — every text section as Field chips, hairline-divided, Edit per section
   (mirrors PersonalInfoCard). Keeps the same per-section Edit you have today. */
function DetailsPanel({ data, onEdit }) {
  const sections = SECTIONS.filter((s) => s.rows(data[s.key] || {}).length > 0);

  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-5 border-b border-slate-100 bg-orange-50/40">
        <h2 className="text-xl font-bold text-slate-800 leading-tight">Application Details</h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Everything you've entered, grouped by section
        </p>
      </div>

      <div className="px-6 flex flex-col divide-y divide-slate-100">
        {sections.map((s) => (
          <div key={s.key} className="py-6 first:pt-6 last:pb-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                  {s.title}
                </p>
              </div>
              <EditPill onClick={() => onEdit(s.key)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {s.rows(data[s.key] || {}).map(([label, value]) => (
                <Field key={label} label={label} value={value} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* One uploaded document row — thumbnail + name + Edit (mirrors KYC checklist). */
function DocumentRow({ doc, onEdit }) {
  const { label, source } = doc;
  const { url, isImage } = useDocumentUrl(source);

  return (
    <li className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-xl hover:bg-orange-50/60 transition-colors duration-200">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
        {isImage && url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <FileText size={16} className="text-slate-400" />
        )}
      </span>
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-slate-700 leading-tight truncate">
          {label}
        </span>
        <span className="block text-xs text-slate-400 font-medium truncate">
          {documentName(source)}
        </span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        className="ml-auto shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all duration-150 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600 active:scale-[0.97]"
      >
        <Pencil size={12} strokeWidth={2.5} />
      </button>
    </li>
  );
}

/* RIGHT rail — all uploaded documents as a verification checklist (mirrors
   KycComplianceCard). Each row's Edit jumps to that section's editor. */
function DocumentsRail({ data, onEdit }) {
  const docs = SECTIONS.flatMap((s) =>
    (s.files?.(data[s.key] || {}) || [])
      .filter(([, source]) => hasDocument(source))
      .map(([label, source]) => ({ sectionKey: s.key, label, source }))
  );

  return (
    <aside className="w-80 shrink-0">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
                Documents
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50">
              {docs.length} uploaded
            </span>
          </div>

          {docs.length > 0 ? (
            <ul className="space-y-1">
              {docs.map((doc) => (
                <DocumentRow
                  key={`${doc.sectionKey}-${doc.label}`}
                  doc={doc}
                  onEdit={() => onEdit(doc.sectionKey)}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 font-medium py-2">No documents uploaded yet.</p>
          )}
        </div>
      </div>
    </aside>
  );
}

export default function ReviewStep({ data = {}, onUpdateSection, onSubmit }) {
  const [editing, setEditing] = useState(null); // section key currently open for edit

  const [review, setReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(true);
  const [reviewError, setReviewError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  /**
   * Pull the whole application back from the server.
   *
   * This is what makes the screen truthful for anyone who didn't fill the
   * wizard in one sitting. `data` is the current sitting's buffer and is empty
   * on a resume, so without this a POSP who finished six steps last week and
   * came back to submit would be shown a review of nothing at all.
   */
  useEffect(() => {
    let cancelled = false;

    fetchReviewDetails()
      .then((result) => {
        if (cancelled) return;
        setReview(result);
        setLoadingReview(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setReviewError(error);
        setLoadingReview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retryReview = () => {
    setLoadingReview(true);
    setReviewError(null);
    setAttempt((n) => n + 1);
  };

  /**
   * Server record underneath, this sitting's edits on top.
   *
   * Local wins on conflict, for two reasons: it is the more recent of the two
   * whenever they disagree (a section edited here has been saved, so the server
   * agrees anyway), and it carries the `File` objects, which let a document
   * thumbnail render without a second round trip for bytes the browser already
   * has.
   */
  const merged = useMemo(() => {
    if (!review) return data;
    const out = {};
    for (const section of SECTIONS) {
      out[section.key] = { ...review.sections[section.key], ...(data[section.key] ?? {}) };
    }
    return out;
  }, [review, data]);

  /** Only shown once we have a verdict, and only when it's actually blocking. */
  const blockedReasons =
    review && !review.isSubmissionAllowed ? review.blockingReasons : [];

  const [submitting, setSubmitting] = useState(false);

  /**
   * Kept awaited so the button stays disabled for the whole round trip — this
   * is the one action in the wizard that must not be fired twice, and it is
   * also the slowest, which is exactly the combination that invites a second
   * click. `onSubmit` handles its own errors and navigates on success, so the
   * only thing left to do here is put the button back for the failure case.
   */
  const handleSubmitClick = async () => {
    setSubmitting(true);
    try {
      await onSubmit?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = (key) => (payload) => {
    onUpdateSection?.(key, payload);
    setEditing(null);
    // The editor just saved to the server, so the verdict may have moved with
    // it — a section that was blocking submission might no longer be. Refetched
    // without touching `loadingReview`, so the page updates in place instead of
    // collapsing back to skeletons over a change the user just made.
    setAttempt((n) => n + 1);
  };

  // Editing a section: focus on that one step's form alone (centered), so the
  // grid and its long scroll collapse to a single card until Save / Cancel.
  if (editing) {
    const section = SECTIONS.find((s) => s.key === editing);
    const { Editor } = section;
    return (
      <div className="w-full max-w-77.5 sm:max-w-90 lg:max-w-97.5 xl:max-w-97.5 mx-auto lg:mx-0 flex flex-col items-center gap-2">
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 transition-all duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          >
            <X size={12} strokeWidth={2.5} /> Cancel editing
          </button>
        </div>
        <Editor initialValues={merged[editing] || {}} onNext={handleSave(editing)} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl xl:max-w-7xl flex flex-col gap-5">

      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-linear-to-br from-orange-50/60 to-white px-5 sm:px-8 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <CheckCircle2 size={13} strokeWidth={2.5} />
          Step 8 · Review & Submit
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
          Review your details
        </h2>
        <p className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-500 mt-1">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
          <span>Check each section below, then tap <strong className="font-semibold text-slate-600">Edit</strong> to make changes.</span>
        </p>
      </div>

      {/* The server record couldn't be read. Non-blocking on purpose: whatever
          was filled in during this sitting is still worth showing and still
          submittable, so this reports the gap and offers the retry rather than
          replacing the screen with an error. */}
      {reviewError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-5 sm:px-8 py-4">
          <p className="flex items-start gap-1.5 text-xs sm:text-sm font-medium text-amber-700" role="alert">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>
              Couldn't load your saved details, so anything entered in an earlier
              session may be missing below.
            </span>
          </p>
          <button
            type="button"
            onClick={retryReview}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-colors duration-200 hover:bg-amber-50 active:scale-[0.98]"
          >
            <RotateCcw size={12} strokeWidth={2.5} />
            Try again
          </button>
        </div>
      )}

      {loadingReview ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-44 rounded-2xl border border-slate-100 bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile / tablet — the original tiled grid, unchanged (hidden on xl up) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start xl:hidden">
            {SECTIONS.map((section) => (
              <SummaryCard
                key={section.key}
                section={section}
                data={merged[section.key] || {}}
                onEdit={() => setEditing(section.key)}
              />
            ))}
          </div>

          {/* Desktop — profile-style 3-zone: identity · details · documents */}
          <div className="hidden xl:flex gap-5 items-start">
            <IdentityRail data={merged} review={review} />
            <DetailsPanel data={merged} onEdit={setEditing} />
            <DocumentsRail data={merged} onEdit={setEditing} />
          </div>
        </>
      )}

      {/* Submit — onSubmit navigates the user onward (a success toast greets
          them on the next page), so there's no post-submit state to show here. */}
      <div className="rounded-2xl border border-slate-100 bg-white px-5 sm:px-8 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* What the server says is still missing. It is the authority on this —
            the wizard's own step ticks describe what was filled in here, not
            what survived validation on the way in — so these are listed
            verbatim rather than re-derived from the sections above. */}
        {blockedReasons.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-700">
              <AlertCircle size={14} className="shrink-0" />
              Before you can submit
            </p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-xs sm:text-sm text-amber-700">
              {blockedReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          type="button"
          onClick={handleSubmitClick}
          /* Only ever gated on a verdict we actually received: if the review
             call failed there is no `review`, and blocking submission on a
             fact we don't have would strand someone whose application is
             perfectly complete. */
          disabled={
            submitting || loadingReview || (review ? !review.isSubmissionAllowed : false)
          }
          className="w-full flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send size={16} strokeWidth={2.5} /> Submit Application
            </>
          )}
        </Button>
        <p className="mt-3 text-center text-[0.75rem] text-slate-400">
          By submitting, you confirm the details above are accurate.
        </p>
      </div>

    </div>
  );
}
