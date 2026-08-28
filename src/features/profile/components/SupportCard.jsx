import { formatMobile, initials, telHref } from '../lib/profileFields';

/* Small inline icons — no extra dependency, matches ProfileCard's icon-free style. */
function PhoneIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

const ACTION =
  'flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.98] transition-all duration-300 text-sm font-semibold';

/** A contact line that renders only when there is something to contact. */
function ContactRow({ label, value, href }) {
  if (!value) return null;

  return (
    <li className="flex items-center gap-3">
      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600 shrink-0">
        {href?.startsWith('tel:') ? <PhoneIcon /> : <MailIcon />}
      </span>
      <div className="min-w-0">
        <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
          {label}
        </span>
        {href ? (
          <a
            href={href}
            className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors truncate block"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm font-semibold text-slate-700 truncate block">{value}</span>
        )}
      </div>
    </li>
  );
}

/**
 * The two people a POSP can reach: their relationship manager, and the desk.
 *
 * Both come straight off `/posp/me` — `rmName`/`rmCode`/`rmMobile`/`rmEmail`
 * and `supportName`/`supportMobile`/`supportEmail` — which is why "Priya Nair,
 * Regional Manager" and the `posp.example` addresses could go. Two things had
 * no field behind them and are gone rather than guessed: the manager's
 * photograph (initials stand in) and the desk's working hours, which would be a
 * promise about when somebody answers the phone.
 */
const SupportCard = ({ profile }) => {
  const rmName = profile?.rmName;
  const rmPhone = formatMobile(profile?.rmMobile);
  const supportPhone = formatMobile(profile?.supportMobile);

  const hasManager = Boolean(rmName || rmPhone || profile?.rmEmail);
  const hasSupport = Boolean(supportPhone || profile?.supportEmail);

  /* Nothing to show at all — better no card than a card of empty headings. */
  if (!hasManager && !hasSupport) return null;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* ─── Section: Relationship Manager ─── */}
      {hasManager ? (
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-4">
            Relationship Manager
          </p>

          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 text-orange-400 text-base font-bold shrink-0 select-none">
              {initials(rmName)}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-800 leading-tight truncate">
                {rmName || 'Your relationship manager'}
              </h3>
              {profile?.rmCode ? (
                <p className="text-sm text-slate-500 font-medium truncate font-data-mono">
                  {profile.rmCode}
                </p>
              ) : null}
            </div>
          </div>

          {/* Manager quick-contact actions — only the ones we have a value for. */}
          {rmPhone || profile?.rmEmail ? (
            <div className={`mt-4 grid gap-2 ${rmPhone && profile?.rmEmail ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {rmPhone ? (
                <a href={telHref(profile.rmMobile)} className={ACTION}>
                  <PhoneIcon />
                  Call
                </a>
              ) : null}
              {profile?.rmEmail ? (
                <a href={`mailto:${profile.rmEmail}`} className={ACTION}>
                  <MailIcon />
                  Email
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ─── Section: POSP Platform Support ─── */}
      {hasSupport ? (
        <div className={`px-6 pb-6 pt-6 ${hasManager ? 'border-t border-slate-100' : ''}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-4">
            {profile?.supportName || 'POSP Platform Support'}
          </p>

          <ul className="space-y-3">
            <ContactRow label="Helpline" value={supportPhone} href={telHref(profile?.supportMobile)} />
            <ContactRow
              label="Email"
              value={profile?.supportEmail}
              href={profile?.supportEmail ? `mailto:${profile.supportEmail}` : null}
            />
          </ul>

          {/* Was a dead button; now it opens the desk's own address. */}
          {profile?.supportEmail ? (
            <a
              href={`mailto:${profile.supportEmail}`}
              className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-sm font-semibold shadow-md hover:shadow-orange-500/25 active:scale-[0.98] transition-all duration-300"
            >
              Contact Support
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default SupportCard;
