import { maskAadhaar, maskAccount, maskPan, verdictOf } from '../lib/profileFields';

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

/**
 * ⚠ "On file", not "Verified".
 *
 * This is the whole point of the card's rewrite. `/posp/me` reports a single
 * KYC verdict for the POSP — `kycStatus`, and the `verification` derived from
 * it — and says nothing about individual documents. The old card printed
 * `status: 'verified'` as a literal on every row, which stated four separate
 * approvals the server had never given.
 *
 * What this app can honestly say per document is whether the record carries one.
 * The verdict, singular, is the pill in the header.
 */
const PRESENCE = {
  present: {
    label: 'On file',
    pill: 'text-emerald-600 bg-emerald-50',
    icon: 'text-emerald-600 bg-emerald-50',
  },
  missing: {
    label: 'Not on file',
    pill: 'text-amber-600 bg-amber-50',
    icon: 'text-amber-600 bg-amber-50',
  },
};

function ChecklistRow({ label, value }) {
  const state = value ? PRESENCE.present : PRESENCE.missing;

  return (
    /* negative horizontal margin + padding trick lets hover bg extend to card edges */
    <li className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-xl hover:bg-orange-50/60 transition-colors duration-200 cursor-default">
      <span className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${state.icon}`}>
        {value ? <CheckIcon /> : <ClockIcon />}
      </span>

      <div className="min-w-0">
        <span className="block text-sm font-semibold text-slate-700 leading-tight">
          {label}
        </span>
        <span className="block text-xs text-slate-400 font-medium truncate">
          {value || 'Awaiting upload'}
        </span>
      </div>

      <span className={`ml-auto shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${state.pill}`}>
        {state.label}
      </span>
    </li>
  );
}

/**
 * KYC documents and the back office's verdict on them.
 *
 * The licence block that used to sit at the bottom — number
 * `IRDAI-POSP-2024-88172`, issued March 2024, 284 days to renewal, with a
 * progress bar and a "Renew License" button — was invented end to end. There is
 * no licence endpoint, no issue or expiry date anywhere in the API, and nothing
 * to renew against. It is replaced by the registration facts the record does
 * carry.
 */
const KycComplianceCard = ({ profile }) => {
  const verdict = verdictOf(profile);

  const documents = [
    { label: 'PAN Card', value: maskPan(profile?.pancardNumber) },
    { label: 'Aadhaar', value: maskAadhaar(profile?.aadhaarNumber) },
    {
      label: 'Bank Account',
      value: (() => {
        const account = maskAccount(profile?.accountNumber);
        if (!account) return null;
        return profile?.bankName ? `${profile.bankName} ${account}` : account;
      })(),
    },
    { label: 'Photograph', value: profile?.profileImagePath ? 'Uploaded' : null },
  ];

  const onFile = documents.filter((doc) => doc.value).length;

  return (
    <div className="card-lift w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* ── Document checklist ── */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600 truncate">
              KYC &amp; Compliance
            </p>
          </div>
          {/* The one verdict the server actually gives, for the record as a whole. */}
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${verdict.pill}`}>
            {verdict.label}
          </span>
        </div>

        <ul className="space-y-1">
          {documents.map((doc) => (
            <ChecklistRow key={doc.label} {...doc} />
          ))}
        </ul>

        <p className="mt-4 text-xs font-medium text-slate-400">
          {onFile} of {documents.length} documents on file
        </p>
      </div>

      {/* ── Registration ── */}
      <div className="px-6 pb-6 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            POSP Registration
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 shrink-0">
            <ShieldIcon />
          </span>
          <div className="min-w-0">
            <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
              POSP Code
            </span>
            <span className="block text-sm font-semibold text-slate-700 font-data-mono truncate">
              {/* Allocated by the back office when the profile clears, so a POSP
                  still in review genuinely has none yet. */}
              {profile?.pospCode || 'Allocated once your KYC is approved'}
            </span>
          </div>
        </div>

        {profile?.status ? (
          <p className="mt-3 text-xs font-medium text-slate-500">
            Record status: <span className="font-semibold text-slate-700">{profile.status}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default KycComplianceCard;
