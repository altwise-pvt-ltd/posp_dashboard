import { useState } from 'react';
import { BadgeCheck, Mail, MapPin, Pencil, Phone } from 'lucide-react';
import BankEditDialog from './BankEditDialog';
import { useProfilePhoto } from '../hooks/useProfilePhoto';
import {
  composeAddress,
  formatLongDate,
  formatMobile,
  initials,
  formatAccount,
  formatPan,
} from '../lib/profileFields';

const CARD = 'w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6';

const HEADING = 'text-xs font-bold uppercase tracking-widest text-orange-600';

/* Boxed label/value chip — the bg + rounding makes fields visually scannable. */
function Field({ label, value, wide = false }) {
  return (
    <div className={`bg-slate-50 rounded-xl px-3 py-2.5 ${wide ? 'col-span-2' : ''}`}>
      <span className="block text-field-label uppercase tracking-wide text-slate-400 font-semibold mb-1">
        {label}
      </span>
      <span className="block text-sm font-semibold text-slate-700 wrap-break-word">
        {value}
      </span>
    </div>
  );
}

/* Two fields per row at every width; rows with no value are left out. */
function Fields({ rows }) {
  const present = rows.filter((row) => row.value);
  if (!present.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {present.map((row) => (
        <Field key={row.label} {...row} />
      ))}
    </div>
  );
}

/* A titled card of fields. Renders nothing when every row came back empty. */
function FieldCard({ title, rows, action = null }) {
  if (!rows.some((row) => row.value)) return null;

  return (
    <div className={CARD}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-0.5 h-4 rounded-full bg-orange-400 shrink-0" />
        <p className={HEADING}>{title}</p>
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      <Fields rows={rows} />
    </div>
  );
}

export function EditButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-orange-600 transition hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
    >
      <Pencil className="size-3.5" />
      Edit
    </button>
  );
}

/* ID-card layout: branded band with photo, name and POSP code, then contact
   rows, then a date of birth / gender footer. Empty values are left out. */
export function IdentityCard({ profile }) {
  const photo = useProfilePhoto(profile?.profileImagePath);
  const name = profile?.fullName || 'Your profile';

  const contacts = [
    { label: 'Mobile', icon: Phone, value: formatMobile(profile?.mobile) },
    { label: 'Email', icon: Mail, value: profile?.email },
    { label: 'Address', icon: MapPin, value: composeAddress(profile) },
  ].filter((row) => row.value);

  const facts = [
    { label: 'Date of Birth', value: formatLongDate(profile?.dateOfBirth) },
    { label: 'Gender', value: profile?.gender },
  ].filter((row) => row.value);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-linear-to-r from-orange-500 to-rose-500 px-5 py-5">
        <div className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-12 size-24 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-white ring-4 ring-white/40 shadow-md">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-orange-50">
                <span className="text-2xl font-bold tracking-wide text-orange-300 select-none">
                  {initials(profile?.fullName)}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white leading-tight wrap-break-word">
              {name}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-white/85">POSP Insurance Advisor</p>

            {profile?.pospCode ? (
              <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold tracking-wide text-white">
                <BadgeCheck className="size-3.5 shrink-0" />
                <span className="truncate">{profile.pospCode}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {contacts.length ? (
        <ul className="flex flex-col gap-3.5 px-5 py-4">
          {contacts.map(({ label, icon: Icon, value }) => (
            <li key={label} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <span className="block text-field-label uppercase tracking-wide text-slate-400 font-semibold">
                  {label}
                </span>
                <span className="block text-sm font-semibold text-slate-700 wrap-break-word">
                  {value}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {facts.length ? (
        <div className="flex divide-x divide-slate-200 border-t border-slate-100 bg-slate-50">
          {facts.map(({ label, value }) => (
            <div key={label} className="min-w-0 flex-1 px-5 py-3">
              <span className="block text-field-label uppercase tracking-wide text-slate-400 font-semibold">
                {label}
              </span>
              <span className="block text-sm font-semibold text-slate-700 wrap-break-word">
                {value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BankAccountCard({ profile }) {
  const [editing, setEditing] = useState(false);

  const rows = [
    { label: 'Bank Name', value: profile?.bankName },
    { label: 'Branch', value: profile?.branchName },
    { label: 'Account Number', value: formatAccount(profile?.accountNumber) },
    { label: 'IFSC Code', value: profile?.ifscCode },
    { label: 'Account Type', value: profile?.accountType },
    { label: 'PAN', value: formatPan(profile?.pancardNumber) },
  ];

  return (
    <>
      <FieldCard
        title="Bank Account"
        rows={rows}
        action={<EditButton onClick={() => setEditing(true)} />}
      />
      <BankEditDialog open={editing} profile={profile} onClose={() => setEditing(false)} />
    </>
  );
}
