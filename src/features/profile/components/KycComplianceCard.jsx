import Button from '@/shared/components/Button';

function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ShieldIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

const STATUS = {
  verified: {
    label: 'Verified',
    pill: 'text-emerald-600 bg-emerald-50',
    icon: 'text-emerald-600 bg-emerald-50',
  },
  pending: {
    label: 'Pending',
    pill: 'text-amber-600 bg-amber-50',
    icon: 'text-amber-600 bg-amber-50',
  },
};

function ChecklistRow({ label, value, status }) {
  const s = STATUS[status] ?? STATUS.pending;
  return (
    /* negative horizontal margin + padding trick lets hover bg extend to card edges */
    <li className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-xl hover:bg-orange-50/60 transition-colors duration-200 cursor-default">
      <span className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${s.icon}`}>
        {status === 'verified' ? <CheckIcon /> : <ClockIcon />}
      </span>

      <div className="min-w-0">
        <span className="block text-sm font-semibold text-slate-700 leading-tight">
          {label}
        </span>
        <span className="block text-xs text-slate-400 font-medium truncate">
          {value}
        </span>
      </div>

      <span className={`ml-auto shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${s.pill}`}>
        {s.label}
      </span>
    </li>
  );
}

const KycComplianceCard = () => {
  // Example data — replace with the real KYC record later.
  const documents = [
    { label: 'PAN Card', value: 'ABCDE••••F', status: 'verified' },
    { label: 'Aadhaar', value: 'XXXX XXXX 4521', status: 'verified' },
    { label: 'Bank Account', value: 'HDFC ••••3210', status: 'verified' },
    { label: 'Cancelled Cheque', value: 'Awaiting upload', status: 'pending' },
  ];

  const license = {
    number: 'IRDAI-POSP-2024-88172',
    issuedOn: 'Mar 12, 2024',
    expiresOn: 'Mar 11, 2027',
    daysLeft: 284,
    totalDays: 1095,
  };

  const usedPct = Math.min(100, Math.round(((license.totalDays - license.daysLeft) / license.totalDays) * 100));
  const verifiedCount = documents.filter((d) => d.status === 'verified').length;
  const allVerified = verifiedCount === documents.length;

  return (
    <div className="card-lift w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* ── Verification checklist ── */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
              KYC &amp; Compliance
            </p>
          </div>
          {/* verified count as a coloured pill */}
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${allVerified ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
            {verifiedCount}/{documents.length} verified
          </span>
        </div>

        <ul className="space-y-1">
          {documents.map((doc) => (
            <ChecklistRow key={doc.label} {...doc} />
          ))}
        </ul>
      </div>

      {/* ── License renewal ── */}
      <div className="px-6 pb-6 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            POSP License
          </p>
        </div>

        {/* license number in a boxed chip */}
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 shrink-0">
            <ShieldIcon />
          </span>
          <div className="min-w-0">
            <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
              License No.
            </span>
            <span className="block text-sm font-semibold text-slate-700 font-data-mono truncate">
              {license.number}
            </span>
          </div>
        </div>

        {/* validity range */}
        <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Issued {license.issuedOn}</span>
          <span>Expires {license.expiresOn}</span>
        </div>

        {/* progress bar */}
        <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="progress-fill h-full rounded-full bg-linear-to-r from-orange-500 to-rose-500"
            style={{ width: `${usedPct}%` }}
          />
        </div>

        <p className="mt-2 text-xs font-semibold text-amber-600">
          {license.daysLeft} days until renewal
        </p>

        <div className="mt-5">
          <Button type="button">Renew License</Button>
        </div>
      </div>
    </div>
  );
};

export default KycComplianceCard;
