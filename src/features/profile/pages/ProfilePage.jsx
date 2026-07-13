import DashboardLayout from '@/shared/layouts/DashboardLayout';
import ProfileCard from './../components/ProfileCard';
import SupportCard from './../components/SupportCard';
import KycComplianceCard from './../components/KycComplianceCard';
import PersonalInfoCard from './../components/PersonalInfoCard';

function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col xl:flex-row gap-gutter">
        {/* ─── LEFT COLUMN — Identity & contacts (narrow) ─── */}
        <aside className="anim-fade w-full xl:w-75 shrink-0 flex flex-col gap-gutter">
          <ProfileCard />
          <SupportCard />
        </aside>

        {/* ─── MIDDLE COLUMN — Personal & Official info (wide) ─── */}
        <section className="anim-fade-d1 flex-1 min-w-0 flex flex-col gap-gutter">
          <PersonalInfoCard />
        </section>

        {/* ─── RIGHT COLUMN — KYC & Compliance (narrow) ─── */}
        <aside className="anim-fade-d2 w-full xl:w-75 shrink-0 flex flex-col gap-gutter">
          <KycComplianceCard />
        </aside>
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
