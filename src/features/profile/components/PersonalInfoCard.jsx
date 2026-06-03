import React from 'react';

function EditIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function DownloadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

/* Boxed label/value chip — the bg + rounding makes fields visually scannable. */
function Field({ label, value, wide = false }) {
  return (
    <div className={`bg-slate-50 rounded-xl px-3 py-2.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
        {label}
      </span>
      <span className="block text-sm font-semibold text-slate-700 wrap-break-word">
        {value}
      </span>
    </div>
  );
}

/* Section with an orange left-bar accent on the title. */
function Section({ title, children }) {
  return (
    <div className="py-6 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
        <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
          {title}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  );
}

function ActionButton({ children, icon, primary = false, ...props }) {
  const base = 'flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all duration-300';
  const variant = primary
    ? 'bg-linear-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-md hover:shadow-orange-500/25'
    : 'border-2 border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600';
  return (
    <button className={`${base} ${variant}`} {...props}>
      {icon}
      {children}
    </button>
  );
}

const PersonalInfoCard = () => {
  // Example data — replace with the real employee record later.
  const identity = {
    fullName: 'Rakesh Pawar',
    dateOfBirth: 'August 22, 1990',
    gender: 'Male',
    fatherName: 'Suresh Pawar',
    maritalStatus: 'Married',
    nationality: 'Indian',
    email: 'rakesh.pawar@posp.example',
    phone: '+91 98220 11456',
    address: '14, Shivaji Nagar, Pune, Maharashtra 411005',
  };

  const employment = {
    employeeId: 'POSP-2024-0142',
    designation: 'Full-Stack Developer',
    department: 'Technology',
    joinedOn: 'January 15, 2024',
    reportingManager: 'Priya Nair',
    workLocation: 'Pune (Hybrid)',
  };

  const financials = {
    bankName: 'HDFC Bank',
    accountNo: 'XXXX XXXX 3210',
    ifsc: 'HDFC0001234',
    pan: 'ABCDE1234F',
    salaryAccount: 'Savings',
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* ── Header: warm tint + title + actions ── */}
      <div className="px-6 pt-6 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 bg-orange-50/40">
        <div>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">
            Personal &amp; Official Information
          </h2>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Employee record and statutory details
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ActionButton icon={<DownloadIcon />} type="button">
            Export
          </ActionButton>
          <ActionButton icon={<EditIcon />} primary type="button">
            Edit
          </ActionButton>
        </div>
      </div>

      {/* ── Body: three sections divided by hairlines ── */}
      <div className="px-6 flex flex-col divide-y divide-slate-100">
        <Section title="Identity">
          <Field label="Full Name" value={identity.fullName} />
          <Field label="Date of Birth" value={identity.dateOfBirth} />
          <Field label="Gender" value={identity.gender} />
          <Field label="Father's Name" value={identity.fatherName} />
          <Field label="Marital Status" value={identity.maritalStatus} />
          <Field label="Nationality" value={identity.nationality} />
          <Field label="Email" value={identity.email} wide />
          <Field label="Phone" value={identity.phone} />
          <Field label="Address" value={identity.address} wide />
        </Section>

        <Section title="Employment">
          <Field label="Employee ID" value={employment.employeeId} />
          <Field label="Designation" value={employment.designation} />
          <Field label="Department" value={employment.department} />
          <Field label="Date of Joining" value={employment.joinedOn} />
          <Field label="Reporting Manager" value={employment.reportingManager} />
          <Field label="Work Location" value={employment.workLocation} />
        </Section>

        <Section title="Financials">
          <Field label="Bank Name" value={financials.bankName} />
          <Field label="Account Number" value={financials.accountNo} />
          <Field label="IFSC Code" value={financials.ifsc} />
          <Field label="PAN" value={financials.pan} />
          <Field label="Account Type" value={financials.salaryAccount} />
        </Section>
      </div>
    </div>
  );
};

export default PersonalInfoCard;
