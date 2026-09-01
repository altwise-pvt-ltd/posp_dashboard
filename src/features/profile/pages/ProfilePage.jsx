import DashboardLayout from "@/shared/layouts/DashboardLayout";
import Button from "@/shared/components/Button";
import ProfileCard from "./../components/ProfileCard";
import SupportCard from "./../components/SupportCard";
import KycComplianceCard from "./../components/KycComplianceCard";
import PersonalInfoCard from "./../components/PersonalInfoCard";
import CertificatePreviewBox from "../components/CertificatePreviewBox";
import { useProfileRecord } from "../hooks/useProfileRecord";

/* Every width on this screen is decided here. The four cards are `w-full` and
   fill whatever track they are handed — same rule as the onboarding wizard. */
const STACK =
  "mx-auto w-full max-w-4xl xl:max-w-none flex flex-col xl:flex-row gap-gutter";
const RAIL =
  "w-full max-w-100 mx-auto xl:mx-0 xl:max-w-none xl:w-75 shrink-0 flex flex-col gap-gutter";
const BODY = "flex-1 min-w-0 flex flex-col xl:flex-row gap-gutter";
const MAIN = "flex-1 min-w-0";
const ASIDE = "w-full xl:w-75 shrink-0";

function ProfileSkeleton() {
  return (
    <div className={`${STACK} animate-pulse`} aria-hidden="true">
      <div className={RAIL}>
        <div className="rounded-2xl bg-slate-100">
          <div className="aspect-square" />
          <div className="h-48" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-100" />
      </div>
      <div className={BODY}>
        <div className={`${MAIN} h-128 rounded-2xl bg-slate-100`} />
        <div className={`${ASIDE} h-80 rounded-2xl bg-slate-100`} />
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
      <h2 className="text-lg font-bold text-slate-800">
        Couldn’t load your profile
      </h2>
      <p className="mt-2 text-sm text-slate-500 font-medium">
        {error?.message || "The server didn’t answer. Please try again."}
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
 * The record is fetched once here and handed down, rather than each card
 * subscribing for itself: four cards reading one store is four re-render paths
 * for one fact, and passing it as a prop keeps the cards pure enough to render
 * from a fixture.
 */
function ProfilePage() {
  const { profile, loading, error, retry } = useProfileRecord();

  return (
    <DashboardLayout>
      <div className="profile-scale lg:-mx-3">
        {!profile && loading ? <ProfileSkeleton /> : null}

        {!profile && !loading && error ? (
          <ProfileError error={error} onRetry={retry} />
        ) : null}

        {profile ? (
          <div className={STACK}>
            <aside className={`anim-fade ${RAIL}`}>
              <ProfileCard profile={profile} />
              <CertificatePreviewBox />
              <SupportCard profile={profile} />
            </aside>

            <div className={BODY}>
              <section className={`anim-fade-d1 ${MAIN}`}>
                <PersonalInfoCard profile={profile} />
              </section>

              <aside className={`anim-fade-d2 ${ASIDE}`}>
                <KycComplianceCard profile={profile} />
              </aside>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
