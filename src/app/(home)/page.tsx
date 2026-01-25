"use client";

import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo } from "@/services/general";
import { useGlobalStore } from "@/store/useGlobalStore";
import { SearchBar } from "@/components/search";
import { StatItem, StatsRow } from "./components/StatCard";
import { ChartStatCard } from "./components/ChartStatCard";
import { LatestUserTransactions } from "./components/LatestUserTransactions";
import { useGetPeakTPS, useGetAnalyticsData } from "@/hooks";
import PageNavigation from "@/components/layout/PageNavigation";

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
    analyticsData?.daily_active_users?.slice(-1)[0]?.daily_active_user_count ?? 0;

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
    analyticsData?.daily_user_transactions?.slice(-1)[0]?.num_user_transactions ?? 0;

  const isAnalyticsLoading = !analyticsData;

  return (
    <div className="min-h-screen">
      {/* Mobile Search Navigation - 仅移动端显示 */}
      <PageNavigation showBackButton={false} hideOnDesktop />

      {/* Hero Section - 仅桌面端显示，移动端使用导航栏搜索 */}
      <section className="relative hidden md:block">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-moveus-marigold-950/10 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 py-10 relative">
          <div className="max-w-230 space-y-4">
            {/* Hero Title */}
            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              Explore the Movement Network
            </h1>

            {/* Search Bar */}
            <SearchBar
              variant="hero"
              placeholder="Search by Address / Txn Hash / Block / Token"
            />

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground">
              The next-generation high-performance blockchain explorer powered by Move
            </p>
          </div>
        </div>
      </section>

      {/* Network Stats */}
      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-0 space-y-3">
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

      {/* Latest User Transactions */}
      <div className="container mx-auto px-4 pb-12">
        <LatestUserTransactions limit={10} />
      </div>
    </div>
  );
}
