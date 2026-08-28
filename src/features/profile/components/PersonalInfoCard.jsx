import {
  composeAddress,
  formatLongDate,
  formatMobile,
  maskAccount,
  maskPan,
  verdictOf,
} from '../lib/profileFields';

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

/**
 * Section with an orange left-bar accent on the title.
 *
 * Renders nothing at all when every row in it came back empty — an "Identity"
 * heading over a blank grid reads as a loading failure, and this screen has a
 * real one of those to show instead.
 */
function Section({ title, rows }) {
  const present = rows.filter((row) => row.value);
  if (!present.length) return null;

  return (
    <div className="py-6 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
        <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
          {title}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {present.map((row) => (
          <Field key={row.label} {...row} />
        ))}
      </div>
    </div>
  );
}

/**
 * The POSP's own record, from `/posp/me`.
 *
 * Three sections that used to be Identity / Employment / Financials, filled
 * with a fictional Pune developer on a salary account. Two of them were
 * describing the wrong kind of person entirely: a POSP is an agent, not an
 * employee, so "Designation", "Department", "Reporting Manager" and "Work
 * Location" had no field behind them and no meaning here either. They are
 * replaced by what the record actually holds — the POSP code, the referral
 * code, and the KYC verdict.
 *
 * Father's name, marital status and nationality are gone for the simpler
 * reason: `/posp/me` does not carry them.
 */
const PersonalInfoCard = ({ profile }) => {
  const verdict = verdictOf(profile);

  const identity = [
    { label: 'Full Name', value: profile?.fullName },
    { label: 'Date of Birth', value: formatLongDate(profile?.dateOfBirth) },
    { label: 'Gender', value: profile?.gender },
    { label: 'Mobile', value: formatMobile(profile?.mobile) },
    { label: 'Email', value: profile?.email, wide: true },
    { label: 'Address', value: composeAddress(profile), wide: true },
  ];

  const registration = [
    { label: 'POSP Code', value: profile?.pospCode },
    { label: 'Referral Code', value: profile?.referralCode },
    /* The server's own wording, next to the verdict the app derived from it.
       When they disagree, this is where it shows. */
    { label: 'KYC Status', value: profile?.kycStatus ?? verdict.label },
    { label: 'Record Status', value: profile?.status },
  ];

  const bank = [
    { label: 'Bank Name', value: profile?.bankName },
    { label: 'Branch', value: profile?.branchName },
    { label: 'Account Number', value: maskAccount(profile?.accountNumber) },
    { label: 'IFSC Code', value: profile?.ifscCode },
    { label: 'Account Type', value: profile?.accountType },
    { label: 'PAN', value: maskPan(profile?.pancardNumber) },
  ];

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* ── Header: warm tint + title ── */}
      <div className="px-6 pt-6 pb-5 border-b border-slate-100 bg-orange-50/40">
        <h2 className="text-xl font-bold text-slate-800 leading-tight">
          Personal &amp; Official Information
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Your registered POSP record and statutory details
        </p>
      </div>

      {/* ── Body: sections divided by hairlines ── */}
      <div className="px-6 flex flex-col divide-y divide-slate-100">
        <Section title="Identity" rows={identity} />
        <Section title="Registration" rows={registration} />
        <Section title="Bank Account" rows={bank} />
      </div>
    </div>
  );
};

export default PersonalInfoCard;
