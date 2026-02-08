"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getLedgerInfo } from "@/services";
import { useGetAnalyticsData } from "@/hooks/analytics/useGetAnalyticsData";
import { useGetPeakTPS } from "@/hooks/analytics/useGetTPS";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import AnalyticsSidebar, {
  AnalyticsSectionId,
} from "./components/AnalyticsSidebar";
import StatsOverview from "./components/StatsOverview";
import SectionHeader from "./components/SectionHeader";
import SimpleChartCard from "./components/SimpleChartCard";
import { ChartRangeDays } from "./components/ChartRangeDaysSelect";
import DailyUserTransactionsChart from "./components/charts/DailyUserTransactionsChart";
import DailyPeakTPSChart from "./components/charts/DailyPeakTPSChart";
import DailyActiveUserChart from "./components/charts/DailyActiveUserChart";
import MonthlyActiveUserChart from "./components/charts/MonthlyActiveUserChart";
import DailyNewAccountsCreatedChart from "./components/charts/DailyNewAccountsCreatedChart";
import DailyDeployedContractsChart from "./components/charts/DailyDeployedContractsChart";
import DailyContractDeployersChart from "./components/charts/DailyContractDeployersChart";
import DailyGasConsumptionChart from "./components/charts/DailyGasConsumptionChart";
import DailyAvgGasUnitPriceChart from "./components/charts/DailyAvgGasUnitPriceChart";

/**
 * AnalyticsPage - Etherscan-inspired analytics dashboard
 * Features:
 * - Sidebar navigation (sticky on desktop, drawer on mobile)
 * - Unified stats grid with all key metrics
 * - Individual chart cards with day range toggles
 * - Responsive design (1-col mobile → 2-col tablet → 4-col desktop)
 * - Guild Green brand colors throughout
 */
export default function AnalyticsPage() {
  const [activeSection, setActiveSection] =
    useState<AnalyticsSectionId>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Day range state for each section
  const [networkActivityDays, setNetworkActivityDays] = useState<ChartRangeDays>(
    ChartRangeDays.DEFAULT_RANGE
  );
  const [userMetricsDays, setUserMetricsDays] = useState<ChartRangeDays>(
    ChartRangeDays.DEFAULT_RANGE
  );
  const [developerActivityDays, setDeveloperActivityDays] = useState<ChartRangeDays>(
    ChartRangeDays.DEFAULT_RANGE
  );
  const [gasFeesDays, setGasFeesDays] = useState<ChartRangeDays>(
    ChartRangeDays.DEFAULT_RANGE
  );

  const { network_value, aptos_client } = useGlobalStore();
  const data = useGetAnalyticsData();
  const { peakTps } = useGetPeakTPS();

  const { data: ledgerData } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: 10000,
  });

  const ledgerVersion = ledgerData?.ledger_version;

  // Handle manual section change (from sidebar clicks)
  const handleSectionChange = (section: AnalyticsSectionId) => {
    setIsScrolling(true);
    setActiveSection(section);

    // Scroll to the section
    const element = document.getElementById(`section-${section}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Re-enable auto-detection after scrolling completes
    // Smooth scrolling typically takes 300-500ms, so we wait a bit longer
    setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

  // Auto-detect active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Skip auto-detection during programmatic scrolling
      if (isScrolling) return;

      const sections: AnalyticsSectionId[] = [
        "overview",
        "network-activity",
        "user-metrics",
        "developer-activity",
        "gas-fees",
      ];

      // Find the section that's currently in view
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(`section-${sections[i]}`);
        if (section) {
          const rect = section.getBoundingClientRect();
          // Check if section is in viewport (with some offset for better UX)
          if (rect.top <= 150) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolling]);

  return (
    <>
      <PageNavigation />

      <PageContainer>
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Network statistics and performance metrics
          </p>
        </div>
        {/* Layout: Sidebar + Main Content */}
        <div className="flex gap-6">
          <AnalyticsSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            isMobileOpen={isMobileSidebarOpen}
            onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          <div className="flex-1 min-w-0">


            {/* All Stats Grid - Always Visible */}
            <StatsOverview
              data={data}
              ledgerVersion={ledgerVersion}
              peakTps={peakTps}
            />

            {/* Network Activity Charts */}
            <section id="section-network-activity" className="mt-8 scroll-mt-32">
              <SectionHeader
                title="Network Activity"
                days={networkActivityDays}
                onDaysChange={setNetworkActivityDays}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SimpleChartCard title="User Transactions">
                  <DailyUserTransactionsChart
                    data={data?.daily_user_transactions ?? []}
                    days={networkActivityDays}
                  />
                </SimpleChartCard>

                <SimpleChartCard title="Peak TPS">
                  <DailyPeakTPSChart
                    data={data?.daily_max_tps_15_blocks ?? []}
                    days={networkActivityDays}
                  />
                </SimpleChartCard>
              </div>
            </section>

            {/* User Metrics Charts */}
            <section id="section-user-metrics" className="mt-8 scroll-mt-32">
              <SectionHeader
                title="User Metrics"
                days={userMetricsDays}
                onDaysChange={setUserMetricsDays}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SimpleChartCard title="Daily Active Users">
                  <DailyActiveUserChart
                    data={data?.daily_active_users ?? []}
                    days={userMetricsDays}
                  />
                </SimpleChartCard>

                <SimpleChartCard title="Monthly Active Users">
                  <MonthlyActiveUserChart
                    data={data?.mau_signers ?? []}
                    days={userMetricsDays}
                  />
                </SimpleChartCard>

                <SimpleChartCard title="New Accounts Created">
                  <DailyNewAccountsCreatedChart
                    data={data?.daily_new_accounts_created ?? []}
                    days={userMetricsDays}
                  />
                </SimpleChartCard>
              </div>
            </section>

            {/* Developer Activity Charts */}
            <section id="section-developer-activity" className="mt-8 scroll-mt-32">
              <SectionHeader
                title="Developer Activity"
                days={developerActivityDays}
                onDaysChange={setDeveloperActivityDays}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SimpleChartCard title="Deployed Contracts">
                  <DailyDeployedContractsChart
                    data={data?.daily_deployed_contracts ?? []}
                    days={developerActivityDays}
                  />
                </SimpleChartCard>

                <SimpleChartCard title="Contract Deployers">
                  <DailyContractDeployersChart
                    data={data?.daily_contract_deployers ?? []}
                    days={developerActivityDays}
                  />
                </SimpleChartCard>
              </div>
            </section>

            {/* Gas & Fees Charts */}
            <section id="section-gas-fees" className="mt-8 scroll-mt-32">
              <SectionHeader
                title="Gas & Fees"
                days={gasFeesDays}
                onDaysChange={setGasFeesDays}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SimpleChartCard title="Gas Consumption">
                  <DailyGasConsumptionChart
                    data={data?.daily_gas_from_user_transactions ?? []}
                    days={gasFeesDays}
                  />
                </SimpleChartCard>

                <SimpleChartCard title="Average Gas Unit Price">
                  <DailyAvgGasUnitPriceChart
                    data={data?.daily_average_gas_unit_price ?? []}
                    days={gasFeesDays}
                  />
                </SimpleChartCard>
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
