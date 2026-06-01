import DashboardLayout from '@/shared/layouts/DashboardLayout';
import GreetingHeader from '@/features/overview/components/GreetingHeader';
import OnboardingHero from '@/features/overview/components/OnboardingHero';
import TodayFocusBanner from '@/features/overview/components/TodayFocusBanner';
import KpiGrid from '@/features/overview/components/KpiGrid';
import MonthlySalesChart from '@/features/overview/components/MonthlySalesChart';
import RightRail from '@/features/overview/components/RightRail';

function OverviewPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col xl:flex-row gap-gutter">
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
