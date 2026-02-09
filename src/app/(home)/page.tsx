"use client";

import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo } from "@/services/general";
import { useGlobalStore } from "@/store/useGlobalStore";
import { SearchBar } from "@/components/search";
import { StatItem, StatsRow } from "./components/StatCard";
import { ChartStatCard } from "./components/ChartStatCard";
import { LatestUserTransactions } from "./components/LatestUserTransactions";
import { useGetPeakTPS, useGetAnalyticsData } from "@/hooks";
import { PageContainer } from "@/components/layout";

export default function HomePage() {
  const { aptos_client, network_value } = useGlobalStore();

  // Ledger Info (for total transactions)
  const { data: ledgerInfo, isLoading: ledgerLoading } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: 5000,
  });

  // Analytics data
  const analyticsData = useGetAnalyticsData();
  const { peakTps } = useGetPeakTPS();

  // Real data from APIs
  const totalTransactions = ledgerInfo?.ledger_version
    ? parseInt(ledgerInfo.ledger_version)
    : 0;

  const totalAccounts = analyticsData?.total_accounts?.[0]?.total_accounts ?? 0;
  const totalContracts =
    analyticsData?.cumulative_deployers?.[0]?.cumulative_contracts_deployed ??
    0;
  const totalDeployers =
    analyticsData?.cumulative_deployers?.[0]?.cumulative_contract_deployers ??
    0;

  // Daily Active Users (latest)
  const dailyActiveUsers =
    analyticsData?.daily_active_users?.slice(-1)[0]?.daily_active_user_count ??
    0;

  // Extract chart data (last 14 days)
  const CHART_DAYS = 14;

  // Helper function to format date labels
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Contract Deployers chart data
  const deployersChartData =
    analyticsData?.daily_contract_deployers
      ?.slice(-CHART_DAYS)
      .map((d) => d.distinct_deployers) ?? [];
  const deployersChartLabels =
    analyticsData?.daily_contract_deployers
      ?.slice(-CHART_DAYS)
      .map((d) => formatDateLabel(d.date)) ?? [];

  // Daily User Transactions chart data
  const dailyTxnsChartData =
    analyticsData?.daily_user_transactions
      ?.slice(-CHART_DAYS)
      .map((d) => d.num_user_transactions) ?? [];
  const dailyTxnsChartLabels =
    analyticsData?.daily_user_transactions
      ?.slice(-CHART_DAYS)
      .map((d) => formatDateLabel(d.date)) ?? [];
  // Get latest daily transactions value for display
  const latestDailyTxns =
    analyticsData?.daily_user_transactions?.slice(-1)[0]
      ?.num_user_transactions ?? 0;

  const isAnalyticsLoading = !analyticsData;

  return (
    <div className="min-h-screen">
      {/* Hero + Stats Section with Dotted Background - Full Width */}
      <div className="relative overflow-hidden">
        {/* Dotted Background Pattern - Full width, no container constraints */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle, rgba(129, 255, 186, 0.3) 1.2px, transparent 1.2px),
              radial-gradient(circle, rgba(0, 45, 214, 0.18) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px, 24px 24px",
            backgroundPosition: "0 0, 12px 12px",
            maskImage: `linear-gradient(to bottom, black 0%, black 70%, transparent 100%),
                        linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)`,
            maskComposite: "intersect",
            WebkitMaskImage: `linear-gradient(to bottom, black 0%, black 70%, transparent 100%),
                              linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)`,
            WebkitMaskComposite: "source-in",
          }}
        />

        {/* Centered Glow above search bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-guild-green-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-100 h-50 bg-byzantine-blue-500/15 blur-[100px] rounded-full pointer-events-none" />

        {/* Hero Section - Content with container */}
        <section className="relative pt-10 md:pt-10 z-20">
          <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-14 relative">
            <div className="max-w-230 space-y-4">
              {/* Hero Title */}
              <h1 className="text-3xl md:text-5xl font-semibold text-white">
                Explore the Movement Network
              </h1>

              {/* Search Bar */}
              <SearchBar
                variant="hero-subtle"
                placeholder="Search by Address / Txn Hash / Block / Token"
              />
            </div>
          </div>
        </section>

        {/* Network Stats - Content with container */}
        <div className="relative z-10 container max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 space-y-3">
          {/* Row 1: 5 Stat Items */}
          <StatsRow>
            <StatItem
              label="Total Transactions"
              value={totalTransactions}
              tooltip="Total number of transactions on the Movement network."
              isLoading={ledgerLoading}
            />
            <StatItem
              label="Max TPS"
              value={peakTps ?? "-"}
              subLabel="Peak Last 30 Days"
              tooltip="The highest count of user transactions within any two-block interval on a given day, divided by the duration of that interval."
              isLoading={!peakTps && isAnalyticsLoading}
            />
            <StatItem
              label="Total Accounts"
              value={totalAccounts}
              tooltip="Total number of accounts created on the Movement network."
              isLoading={isAnalyticsLoading}
            />
            <StatItem
              label="Contracts Deployed"
              value={totalContracts}
              tooltip="Total number of smart contracts deployed on the network."
              isLoading={isAnalyticsLoading}
            />
            <StatItem
              label="Daily Active Users"
              value={dailyActiveUsers}
              tooltip="Number of unique addresses that signed transactions today."
              isLoading={isAnalyticsLoading}
            />
          </StatsRow>

          {/* Row 2: 2 Chart Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChartStatCard
              label="Contract Deployers"
              value={totalDeployers}
              tooltip="Total number of unique addresses that have deployed contracts."
              isLoading={isAnalyticsLoading}
              chartData={deployersChartData}
              chartLabels={deployersChartLabels}
            />
            <ChartStatCard
              label="Daily User Transactions"
              value={latestDailyTxns}
              tooltip="Number of user transactions in the last 24 hours."
              isLoading={isAnalyticsLoading}
              chartData={dailyTxnsChartData}
              chartLabels={dailyTxnsChartLabels}
            />
          </div>
        </div>
      </div>

      {/* Latest User Transactions */}
      <PageContainer>
        <LatestUserTransactions limit={10} />
      </PageContainer>
    </div>
  );
}
