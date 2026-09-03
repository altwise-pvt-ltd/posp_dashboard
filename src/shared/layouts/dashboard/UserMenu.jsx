import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAuthStore } from '@/shared/store/authStore';
import { usePospProfileStore } from '@/shared/store/pospProfileStore';
import { useProfilePhoto } from '@/features/profile/hooks/useProfilePhoto';
import AppLink from '@/shared/components/AppLink';

/**
 * The signed-in POSP, as the bar shows them.
 *
 * Two sources, in order: `GET /posp/me` if a screen has already fetched it, the
 * verify-otp reply otherwise. Never fetched from here — this renders inside a
 * bar that also sits on the onboarding side of the funnel, where there is no
 * POSP record to ask for yet. `DashboardLayout` owns the fetch for the pages
 * that do have one.
 *
 * `photoKey` is a document key, not a URL — `useProfilePhoto` is what turns it
 * into something an `<img src>` can take. It is null on the funnel side, where
 * there is no profile, and the hook makes no request for it.
 */
function useAccount() {
  const profileName = usePospProfileStore((s) => s.profile?.fullName);
  const photoKey = usePospProfileStore((s) => s.profile?.profileImagePath);
  const user = useAuthStore((s) => s.user);
  const mobile = useAuthStore((s) => s.mobile);

  const name = profileName || user?.fullName || null;
  return { name, mobile: mobile || user?.mobile || null, photoKey };
}

function UserMenu({ isOpen, onToggle }) {
  const { name, mobile, photoKey } = useAccount();
  const photo = useProfilePhoto(photoKey);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  // Falls back to the number, then to a generic label — the bar renders before
  // any of it is guaranteed to have arrived.
  const label = name || mobile || 'Your account';
  const initial = name ? name.trim()[0].toUpperCase() : null;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/30"
      >
        {/* The selfie uploaded during onboarding, when there is one. Initials
            (then a generic glyph) stand in while it loads and for anyone whose
            record carries no photograph. */}
        <div className="w-8 h-8 rounded-full bg-orange-500 overflow-hidden flex items-center justify-center text-white text-sm font-bold">
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            initial ?? <UserRound className="h-4 w-4" aria-hidden="true" />
          )}
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
          <AppLink
            to="/profile"
            onClick={onToggle}
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Your profile
          </AppLink>
          {/* Inert until the screen exists — an anchor here would only dirty
              the URL with a hash and scroll the page to the top. */}
          <span
            aria-disabled="true"
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-default"
          >
            Change Password
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 border-t border-slate-100 hover:bg-red-50 disabled:opacity-60 disabled:hover:bg-transparent focus:outline-none focus:bg-red-50"
          >
            {signingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
