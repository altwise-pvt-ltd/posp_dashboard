import DashboardLayout from '@/shared/layouts/DashboardLayout';
import GreetingHeader from '@/features/overview/components/GreetingHeader';
import OnboardingHero from '@/features/overview/components/OnboardingHero';
import TodayFocusBanner from '@/features/overview/components/TodayFocusBanner';
import KpiGrid from '@/features/overview/components/KpiGrid';
import MonthlySalesChart from '@/features/overview/components/MonthlySalesChart';
import RightRail from '@/features/overview/components/RightRail';

/**
 * The rail pulls out of the flow at `md` — every screen above a phone gets the
 * two-column view. That costs the left column 280px it used to keep until
 * `2xl`, so the grids inside it (hero products, KPI cards) each carry their own
 * later breakpoints to stay above their minimum card width. The rail itself is
 * 16rem until `2xl` for the same reason; it only reaches 20rem once the shell
 * is wide enough to give it away.
 */
function OverviewPage() {
  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col md:flex-row gap-gutter">
        <div className="flex-1 flex flex-col gap-gutter min-w-0">
          <GreetingHeader />
          <OnboardingHero />
          <TodayFocusBanner />
          <KpiGrid />
          <MonthlySalesChart />
        </div>
        <RightRail />
      </div>
    </DashboardLayout>
  );
}

export default OverviewPage;
