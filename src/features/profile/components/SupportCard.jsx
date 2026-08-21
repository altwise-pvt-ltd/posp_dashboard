import Button from '@/shared/components/Button';

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

function ClockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

const SupportCard = () => {
  // Example data — replace with the real records (manager + support desk) later.
  const manager = {
    name: 'Priya Nair',
    role: 'Regional Manager',
    phone: '+91 98765 43210',
    email: 'priya.nair@posp.example',
    imageUrl: 'https://i.pravatar.cc/200?img=47',
  };

  const support = {
    helpline: '1800 200 1234',
    email: 'support@posp.example',
    hours: 'Mon–Sat, 9:00 AM – 7:00 PM',
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* ─── Section: Reporting Manager ─── */}
      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-4">
          Reporting Manager
        </p>

        <div className="flex items-center gap-3">
          <img
            src={manager.imageUrl}
            alt={manager.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover bg-slate-100 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 leading-tight truncate">
              {manager.name}
            </h3>
            <p className="text-sm text-slate-500 font-medium truncate">
              {manager.role}
            </p>
          </div>
        </div>

        {/* Manager quick-contact actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={`tel:${manager.phone.replace(/\s/g, '')}`}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.98] transition-all duration-300 text-sm font-semibold"
          >
            <PhoneIcon />
            Call
          </a>
          <a
            href={`mailto:${manager.email}`}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.98] transition-all duration-300 text-sm font-semibold"
          >
            <MailIcon />
            Email
          </a>
        </div>
      </div>

      {/* ─── Section: POSP Platform Support ─── */}
      <div className="px-6 pb-6 pt-6 border-t border-slate-100">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-4">
          POSP Platform Support
        </p>

        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600 shrink-0">
              <PhoneIcon />
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                Helpline
              </span>
              <a
                href={`tel:${support.helpline.replace(/\s/g, '')}`}
                className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors"
              >
                {support.helpline}
              </a>
            </div>
          </li>

          <li className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600 shrink-0">
              <MailIcon />
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                Email
              </span>
              <a
                href={`mailto:${support.email}`}
                className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition-colors truncate block"
              >
                {support.email}
              </a>
            </div>
          </li>

          <li className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600 shrink-0">
              <ClockIcon />
            </span>
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                Working Hours
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {support.hours}
              </span>
            </div>
          </li>
        </ul>

        <div className="mt-5">
          <Button type="button">Contact Support</Button>
        </div>
      </div>
    </div>
  );
};

export default SupportCard;
