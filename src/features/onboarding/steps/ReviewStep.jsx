import { useState, useEffect } from "react";
import {
  CreditCard, Mail, Fingerprint, Camera, Landmark, GraduationCap, Building2,
  Pencil, X, FileText, CheckCircle2, ShieldCheck, Send,
} from "lucide-react";
import Button from "@/shared/components/Button";
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

const QUALIFICATION_LABELS = {
  SSC: "SSC",
  HSC: "HSC",
  Graduate: "Graduate",
  PostGraduate: "Post Graduate",
  Professional: "Professional",
};
const ACCOUNT_TYPE_LABELS = { savings: "Savings", current: "Current" };

/**
 * One config object per section drives both the read-only summary and the
 * inline editor:
 *   rows(d)  → [ [label, value], ... ]  text fields to list
 *   files(d) → [ [label, File], ... ]   documents to thumbnail
 *   Editor   → the step component, reused as-is with initialValues + onNext
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
    files: (d) => [["PAN Card", d.panFrontImage]],
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
    rows: (d) => [
      ["Aadhaar Number", formatAadhaar(d.aadhaar)],
      ["Name", d.fullName],
    ],
    files: (d) => [
      ["Aadhaar Front", d.aadhaarFrontImage],
      ["Aadhaar Back", d.aadhaarBackImage],
    ],
  },
  {
    key: "selfie",
    title: "Selfie",
    Icon: Camera,
    Editor: SelfieStep,
    rows: () => [],
    files: (d) => [["Selfie", d.selfie]],
  },
  {
    key: "bank",
    title: "Bank Account",
    Icon: Landmark,
    Editor: BankStep,
    rows: (d) => [
      ["Account Type", ACCOUNT_TYPE_LABELS[d.accountType] || d.accountType],
      ["Account Holder", d.accountHolder],
      ["Account Number", maskAccount(d.accountNumber)],
      ["IFSC Code", d.ifsc],
      ["Bank Name", d.bankName],
    ],
    files: (d) => [
      ["Passbook", d.passbookImage],
      ["Cancelled Cheque", d.chequeImage],
    ],
  },
  {
    key: "education",
    title: "Education",
    Icon: GraduationCap,
    Editor: EducationStep,
    rows: (d) => [
      ["Highest Qualification", QUALIFICATION_LABELS[d.highestQualification] || d.highestQualification],
      ["Institution", d.institutionName || "—"],
      ["Board / University", d.boardOrUniversity || "—"],
      ["Passing Year", d.passingYear || "—"],
    ],
    files: (d) => [["Certificate", d.certificateImage]],
  },
  {
    key: "business",
    title: "Business",
    Icon: Building2,
    Editor: BusinessStep,
    // No business → the step collected an address only, so the business-only
    // rows are dropped rather than listed blank.
    rows: (d) => [
      ["Runs a Business", d.hasBusiness ? "Yes" : "No"],
      ...(d.hasBusiness
        ? [
            ["Business Type", d.businessType],
            ["Business Name", d.businessName],
          ]
        : []),
      ["Address", [d.addressLine1, d.addressLine2, d.city, d.state, d.pincode].filter(Boolean).join(", ")],
      ...(d.hasBusiness ? [["GSTIN", d.gstIn || "—"]] : []),
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

/* ── A single uploaded file: image thumbnail, or a labelled chip for PDFs ── */
function FilePreview({ label, file }) {
  const [url, setUrl] = useState(null);
  const isImage = file instanceof File && file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);

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
        <div className="truncate text-[0.75rem] font-medium text-slate-600">{file?.name || "Uploaded"}</div>
      </div>
    </div>
  );
}

/* ── Read-only summary for one section (mobile / tablet card) ── */
function SummaryCard({ section, data, onEdit }) {
  const { title, Icon } = section;
  const rows = section.rows(data);
  const files = (section.files?.(data) || []).filter(([, f]) => f instanceof File);

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
            {files.map(([label, file]) => (
              <FilePreview key={label} label={label} file={file} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════ DESKTOP (xl+) — profile-style 3-zone view ════════════════════ */

/* LEFT rail — the selfie becomes the applicant's avatar (mirrors ProfileCard). */
function IdentityRail({ data }) {
  const selfie = data.selfie?.selfie;
  const name = data.pan?.fullName || data.aadhaar?.fullName || "Your Application";
  const completed = SECTIONS.filter((s) => {
    const d = data[s.key];
    return d && Object.keys(d).length > 0;
  }).length;

  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!(selfie instanceof File)) return;
    const objectUrl = URL.createObjectURL(selfie);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selfie]);

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
              <span className="block text-base font-bold text-emerald-600">Ready</span>
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
  const { label, file } = doc;
  const isImage = file.type.startsWith("image/");
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!isImage) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);

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
          {file.name || "Uploaded"}
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
      .filter(([, f]) => f instanceof File)
      .map(([label, file]) => ({ sectionKey: s.key, label, file }))
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

  const handleSave = (key) => (payload) => {
    onUpdateSection?.(key, payload);
    setEditing(null);
  };

  // Editing a section: focus on that one step's form alone (centered), so the
  // grid and its long scroll collapse to a single card until Save / Cancel.
  if (editing) {
    const section = SECTIONS.find((s) => s.key === editing);
    const { Editor } = section;
    return (
      <div className="w-full max-w-[310px] sm:max-w-[360px] lg:max-w-[390px] xl:max-w-[390px] mx-auto lg:mx-0 flex flex-col items-center gap-2">
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 transition-all duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          >
            <X size={12} strokeWidth={2.5} /> Cancel editing
          </button>
        </div>
        <Editor initialValues={data[editing] || {}} onNext={handleSave(editing)} />
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

      {/* Mobile / tablet — the original tiled grid, unchanged (hidden on xl up) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start xl:hidden">
        {SECTIONS.map((section) => (
          <SummaryCard
            key={section.key}
            section={section}
            data={data[section.key] || {}}
            onEdit={() => setEditing(section.key)}
          />
        ))}
      </div>

      {/* Desktop — profile-style 3-zone: identity · details · documents */}
      <div className="hidden xl:flex gap-5 items-start">
        <IdentityRail data={data} />
        <DetailsPanel data={data} onEdit={setEditing} />
        <DocumentsRail data={data} onEdit={setEditing} />
      </div>

      {/* Submit — onSubmit navigates the user onward (a success toast greets
          them on the next page), so there's no post-submit state to show here. */}
      <div className="rounded-2xl border border-slate-100 bg-white px-5 sm:px-8 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <Button
          type="button"
          onClick={() => onSubmit?.()}
          className="w-full flex items-center justify-center gap-2"
        >
          <Send size={16} strokeWidth={2.5} /> Submit Application
        </Button>
        <p className="mt-3 text-center text-[0.75rem] text-slate-400">
          By submitting, you confirm the details above are accurate.
        </p>
      </div>

    </div>
  );
}
