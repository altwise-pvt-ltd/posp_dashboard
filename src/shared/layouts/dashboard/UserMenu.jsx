import { UserRound } from 'lucide-react';
import { useAuthStore } from '@/shared/store/authStore';
import { usePospProfileStore } from '@/shared/store/pospProfileStore';

/**
 * The signed-in POSP, as the bar shows them.
 *
 * Two sources, in order: `GET /posp/me` if a screen has already fetched it, the
 * verify-otp reply otherwise. Never fetched from here — this renders inside a
 * bar that also sits on the onboarding side of the funnel, where there is no
 * POSP record to ask for yet.
 */
function useAccountName() {
  const profileName = usePospProfileStore((s) => s.profile?.fullName);
  const user = useAuthStore((s) => s.user);
  const mobile = useAuthStore((s) => s.mobile);

  const name = profileName || user?.fullName || null;
  return { name, mobile: mobile || user?.mobile || null };
}

function UserMenu({ isOpen, onToggle }) {
  const { name, mobile } = useAccountName();

  // Falls back to the number, then to a generic label — the bar renders before
  // any of it is guaranteed to have arrived.
  const label = name || mobile || 'Your account';
  const initial = name ? name.trim()[0].toUpperCase() : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/30"
      >
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
          {initial ?? <UserRound className="h-4 w-4" aria-hidden="true" />}
        </div>
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {label}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
            <p className="text-xs text-slate-500">
              {name && mobile ? mobile : 'Signed in'}
            </p>
          </div>
          {/* Inert until these screens exist — anchors here would only dirty
              the URL with a hash and scroll the page to the top. */}
          <span
            aria-disabled="true"
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-default"
          >
            Your profile
          </span>
          <span
            aria-disabled="true"
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-default"
          >
            Change Password
          </span>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
