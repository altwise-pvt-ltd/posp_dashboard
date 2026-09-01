import { useProfilePhoto } from '../hooks/useProfilePhoto';
import { initials, verdictOf } from '../lib/profileFields';

/**
 * Identity, from `/posp/me`.
 *
 * What this used to show — a stock avatar from `i.pravatar.cc`, "Rakesh Pawar",
 * a join date and a count of 38 policies — was all invented. The count is the
 * one thing that has not come back in some form: no endpoint reports policies
 * sold, so the tile is gone rather than zeroed. A hard `0` would be a claim
 * about this POSP's business, and it is not one this app can make.
 */
const ProfileCard = ({ profile }) => {
  const photo = useProfilePhoto(profile?.profileImagePath);
  const verdict = verdictOf(profile);

  const name = profile?.fullName || 'Your profile';

  return (
    <div className="card-lift w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* ── Avatar: square crop keeps a headshot centered (no face clipping) ── */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Initials rather than a silhouette or a stand-in face — it is plainly
             a placeholder, and it is still *this* POSP's placeholder. */
          <div className="w-full h-full flex items-center justify-center bg-orange-50">
            <span className="text-5xl font-bold tracking-wide text-orange-300 select-none">
              {initials(profile?.fullName)}
            </span>
          </div>
        )}
        {/* subtle fade so the image bleeds into the white content below */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* ── Identity ── */}
      <div className="px-6 pb-6 pt-5 text-center">
        <h2 className="text-2xl font-bold text-slate-800 leading-tight wrap-break-word">
          {name}
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 font-medium">
          POSP Insurance Advisor
        </p>

        {/* ── Stats with vertical divider ── */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-around gap-3">
          {profile?.pospCode ? (
            <>
              <div className="text-center min-w-0">
                <span className="block text-sm font-bold text-slate-700 font-data-mono truncate">
                  {profile.pospCode}
                </span>
                <span className="text-field-label uppercase text-slate-400 font-semibold tracking-wide">
                  POSP Code
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200 shrink-0" />
            </>
          ) : null}

          <div className="text-center min-w-0">
            <span className={`inline-block px-2.5 py-1 rounded-full text-status-pill font-bold uppercase tracking-wide ${verdict.pill}`}>
              {verdict.label}
            </span>
            <span className="mt-1 block text-field-label uppercase text-slate-400 font-semibold tracking-wide">
              KYC Status
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
