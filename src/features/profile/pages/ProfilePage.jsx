import DashboardLayout from '@/shared/layouts/DashboardLayout';
import ProfileCard from './../components/ProfileCard';
import SupportCard from './../components/SupportCard';
import KycComplianceCard from './../components/KycComplianceCard';
import PersonalInfoCard from './../components/PersonalInfoCard';

/**
 * Three columns from `2xl`, not `xl` — same reasoning as OverviewPage, and more
 * acute here because there are two 300px rails rather than one. At `xl` the
 * middle column would be 1280 − 256 sidebar − 48 shell − 648 rails-and-gutters
 * ≈ 328px, narrower than either rail flanking it.
 */
function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col 2xl:flex-row gap-gutter">
        {/* ─── LEFT COLUMN — Identity & contacts (narrow) ─── */}
        <aside className="anim-fade w-full 2xl:w-75 shrink-0 flex flex-col gap-gutter">
          <ProfileCard />
          <SupportCard />
        </aside>

        {/* ─── MIDDLE COLUMN — Personal & Official info (wide) ─── */}
        <section className="anim-fade-d1 flex-1 min-w-0 flex flex-col gap-gutter">
          <PersonalInfoCard />
        </section>

        {/* ─── RIGHT COLUMN — KYC & Compliance (narrow) ─── */}
        <aside className="anim-fade-d2 w-full 2xl:w-75 shrink-0 flex flex-col gap-gutter">
          <KycComplianceCard />
        </aside>
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
