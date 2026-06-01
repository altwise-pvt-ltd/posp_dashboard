import DashboardLayout from '@/shared/layouts/DashboardLayout';
import ProfileCard from './../components/ProfileCard';
import SupportCard from './../components/SupportCard';

/**
 * Temporary visual placeholder for an empty column slot.
 * Delete each <Slot /> as you drop the real component in its place.
 */
function Slot({ label, minH = 'min-h-[140px]' }) {
  return (
    <div
      className={`${minH} rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 flex items-center justify-center text-center p-gutter`}
    >
      <span className="font-label-caps text-label-caps text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}

function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col xl:flex-row gap-gutter">
        {/* ─── LEFT COLUMN — Identity & contacts (narrow) ─── */}
        <aside className="w-full xl:w-75 shrink-0 flex flex-col gap-gutter">
          {/* <ProfileCard /> — avatar, name, role, ACTIVE POSP badge, quick actions */}
          <ProfileCard/>
       
          {/* <SupportCard /> — reporting manager + POSP platform support */}
          <SupportCard />
        </aside>

        {/* ─── MIDDLE COLUMN — Personal & Official info (wide) ─── */}
        <section className="flex-1 min-w-0 flex flex-col gap-gutter">
          {/* <PersonalInfoCard /> — header buttons + Identity / Employment / Financials */}
          <Slot label="Personal & Official Info card" minH="min-h-[620px]" />
        </section>

        {/* ─── RIGHT COLUMN — KYC & Compliance (narrow) ─── */}
        <aside className="w-full xl:w-75 shrink-0 flex flex-col gap-gutter">
          {/* <KycComplianceCard /> — verification checklist + license renewal */}
          <Slot label="KYC & Compliance card" minH="min-h-[600px]" />
        </aside>
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
