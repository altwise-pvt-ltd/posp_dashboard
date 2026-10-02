import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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

      <span className={`ml-auto shrink-0 px-2.5 py-1 rounded-full text-status-pill font-bold uppercase tracking-wide ${state.pill}`}>
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
 * to renew against.
 */
const KycComplianceCard = ({ profile, collapsible = false }) => {
  const verdict = verdictOf(profile);
  // Only the phone layout collapses; everywhere else the card is always open.
  const [toggled, setToggled] = useState(false);
  const open = !collapsible || toggled;

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
      {/* The header is the toggle; the verdict stays visible when collapsed. */}
      <button
        type="button"
        onClick={() => setToggled((prev) => !prev)}
        disabled={!collapsible}
        aria-expanded={collapsible ? open : undefined}
        className={`flex w-full items-center justify-between gap-2 px-6 pt-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500/40 ${open ? 'pb-4' : 'pb-6'}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600 truncate">
            KYC &amp; Compliance
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {/* The one verdict the server actually gives, for the record as a whole. */}
          <span className={`px-2.5 py-1 rounded-full text-status-pill font-bold uppercase tracking-wide ${verdict.pill}`}>
            {verdict.label}
          </span>
          {collapsible ? (
            <ChevronDown
              aria-hidden="true"
              className={`size-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          ) : null}
        </span>
      </button>

      {open ? (
      <>
      <div className="px-6 pb-6">
        <ul className="space-y-1">
          {documents.map((doc) => (
            <ChecklistRow key={doc.label} {...doc} />
          ))}
        </ul>

        <p className="mt-4 text-xs font-medium text-slate-400">
          {onFile} of {documents.length} documents on file
        </p>
      </div>
      </>
      ) : null}
    </div>
  );
};

export default KycComplianceCard;
