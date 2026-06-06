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
  BelowMatric: "Below Matric",
  Matric: "Matric",
  Intermediate: "Intermediate",
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
    rows: (d) => [
      ["Business Type", d.businessType],
      ["Business Name", d.businessName],
      ["Address", [d.addressLine1, d.addressLine2, d.city, d.state, d.pincode].filter(Boolean).join(", ")],
      ["GSTIN", d.gstIn || "—"],
    ],
    files: () => [],
  },
];

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
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="truncate text-[12px] font-medium text-slate-600">{file?.name || "Uploaded"}</div>
      </div>
    </div>
  );
}

/* ── Read-only summary for one section ── */
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
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 transition-all duration-150 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600 active:scale-[0.97]"
        >
          <Pencil size={12} strokeWidth={2.5} /> Edit
        </button>
      </div>

      <div className="px-4 py-3.5">
        <dl className="grid grid-cols-1 gap-y-2.5">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[120px_1fr] gap-3 items-baseline">
              <dt className="text-[12px] font-medium text-slate-400">{label}</dt>
              <dd className="text-[13px] font-semibold text-slate-700 break-words">{value || "—"}</dd>
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

export default function ReviewStep({ data = {}, onUpdateSection, onSubmit }) {
  const [editing, setEditing] = useState(null); // section key currently open for edit
  const [submitted, setSubmitted] = useState(false);

  const handleSave = (key) => (payload) => {
    onUpdateSection?.(key, payload);
    setEditing(null);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit?.();
  };

  // Editing a section: focus on that one step's form alone (centered), so the
  // grid and its long scroll collapse to a single card until Save / Cancel.
  if (editing) {
    const section = SECTIONS.find((s) => s.key === editing);
    const { Editor } = section;
    return (
      <div className="w-full max-w-lg flex flex-col items-center gap-2">
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
    <div className="w-full max-w-4xl flex flex-col gap-5">

      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-linear-to-br from-orange-50/60 to-white px-5 sm:px-8 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <CheckCircle2 size={13} strokeWidth={2.5} />
          Step 8 · Review & Submit
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          Review your details
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          Check everything below. Tap <strong className="text-slate-600">Edit</strong> on any section to make changes.
        </p>
      </div>

      {/* Sections — tiled into two columns to keep the page short */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {SECTIONS.map((section) => (
          <SummaryCard
            key={section.key}
            section={section}
            data={data[section.key] || {}}
            onEdit={() => setEditing(section.key)}
          />
        ))}
      </div>

      {/* Submit */}
      <div className="rounded-2xl border border-slate-100 bg-white px-5 sm:px-8 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {submitted ? (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle2 size={16} strokeWidth={2.5} />
            Application submitted — we'll be in touch shortly.
          </p>
        ) : (
          <>
            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2"
            >
              <Send size={16} strokeWidth={2.5} /> Submit Application
            </Button>
            <p className="mt-3 text-center text-[12px] text-slate-400">
              By submitting, you confirm the details above are accurate.
            </p>
          </>
        )}
      </div>

    </div>
  );
}
