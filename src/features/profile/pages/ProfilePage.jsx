import DashboardLayout from '@/shared/layouts/DashboardLayout';
import Button from '@/shared/components/Button';
import ProfileCard from './../components/ProfileCard';
import SupportCard from './../components/SupportCard';
import KycComplianceCard from './../components/KycComplianceCard';
import PersonalInfoCard from './../components/PersonalInfoCard';
import { useProfileRecord } from '../hooks/useProfileRecord';

/** Pulsing blocks in the shape of the three columns, so the layout doesn't jump. */
function ProfileSkeleton() {
  return (
    <div className="flex flex-col 2xl:flex-row gap-gutter animate-pulse" aria-hidden="true">
      <div className="w-full 2xl:w-75 shrink-0 flex flex-col gap-gutter">
        <div className="h-96 rounded-2xl bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-[32rem] rounded-2xl bg-slate-100" />
      </div>
      <div className="w-full 2xl:w-75 shrink-0">
        <div className="h-80 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

/**
 * Nothing to show and a reason why.
 *
 * Deliberately not a partially-drawn page: every card on this screen states
 * something about a person's identity and KYC, and a card rendered from a
 * failed fetch would be a set of blanks and "Not on file" pills that read as
 * facts about the POSP rather than as a broken request.
 */
function ProfileError({ error, onRetry }) {
  return (
    <div className="max-w-md mx-auto mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-bold text-slate-800">Couldn’t load your profile</h2>
      <p className="mt-2 text-sm text-slate-500 font-medium">
        {error?.message || 'The server didn’t answer. Please try again.'}
      </p>
      <div className="mt-5">
        <Button type="button" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

/**
 * Three columns from `2xl`, not `xl` — same reasoning as OverviewPage, and more
 * acute here because there are two 300px rails rather than one. At `xl` the
 * middle column would be 1280 − 256 sidebar − 48 shell − 648 rails-and-gutters
 * ≈ 328px, narrower than either rail flanking it.
 *
 * The record is fetched once here and handed down, rather than each card
 * subscribing for itself: four cards reading one store is four re-render paths
 * for one fact, and passing it as a prop keeps the cards pure enough to render
 * from a fixture.
 */
function ProfilePage() {
  const { profile, loading, error, retry } = useProfileRecord();

  return (
    <DashboardLayout>
      {!profile && loading ? <ProfileSkeleton /> : null}

      {!profile && !loading && error ? <ProfileError error={error} onRetry={retry} /> : null}

      {profile ? (
        <div className="flex flex-col 2xl:flex-row gap-gutter">
          {/* ─── LEFT COLUMN — Identity & contacts (narrow) ─── */}
          <aside className="anim-fade w-full 2xl:w-75 shrink-0 flex flex-col gap-gutter">
            <ProfileCard profile={profile} />
            <SupportCard profile={profile} />
          </aside>

          {/* ─── MIDDLE COLUMN — Personal & Official info (wide) ─── */}
          <section className="anim-fade-d1 flex-1 min-w-0 flex flex-col gap-gutter">
            <PersonalInfoCard profile={profile} />
          </section>

          {/* ─── RIGHT COLUMN — KYC & Compliance (narrow) ─── */}
          <aside className="anim-fade-d2 w-full 2xl:w-75 shrink-0 flex flex-col gap-gutter">
            <KycComplianceCard profile={profile} />
          </aside>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default ProfilePage;
