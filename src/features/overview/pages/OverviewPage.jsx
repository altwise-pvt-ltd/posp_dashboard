import DashboardLayout from '@/shared/layouts/DashboardLayout';
import GreetingHeader from '@/features/overview/components/GreetingHeader';
import OnboardingHero from '@/features/overview/components/OnboardingHero';
import TodayFocusBanner from '@/features/overview/components/TodayFocusBanner';
import KpiGrid from '@/features/overview/components/KpiGrid';
import MonthlySalesChart from '@/features/overview/components/MonthlySalesChart';
import RightRail from '@/features/overview/components/RightRail';

/**
 * The rail pulls out of the flow at `2xl`, not `xl` — later than TrainingPage's
 * `lg` split for the same content-plus-rail shape, because this page also pays
 * for a 256px sidebar that training doesn't have. At `xl` (1280px) the left
 * column would be 1280 − 256 sidebar − 48 shell − 344 rail-and-gutter ≈ 630px,
 * and the hero inside it would be laying five product cards across ~95px each.
 * Splitting at `2xl` gives the left column the full width until there is
 * genuinely room for both.
 */
function OverviewPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col 2xl:flex-row gap-gutter">
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
