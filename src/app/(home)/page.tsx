"use client";

import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo } from "@/services/general";
import { useGlobalStore } from "@/store/useGlobalStore";
import { SearchBar } from "@/components/search";
import { LatestUserTransactions } from "./components/LatestUserTransactions";
import { useGetPeakTPS, useGetAnalyticsData } from "@/hooks";
import { useGetPriceWithMarketCap } from "@/hooks/useGetPrice";
import { PageContainer } from "@/components/layout";
import { CoreMetricsGrid } from "./components/CoreMetricsGrid";
import { TransactionHistoryChart } from "./components/TransactionHistoryChart";

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

  // Price and Market Cap data
  const { data: priceData, isLoading: priceLoading } =
    useGetPriceWithMarketCap();

  // Real data from APIs
  const totalTransactions = ledgerInfo?.ledger_version
    ? parseInt(ledgerInfo.ledger_version)
    : 0;

  const totalAccounts = analyticsData?.total_accounts?.[0]?.total_accounts ?? 0;

  // Latest average gas price
  const avgGasPriceRaw =
    analyticsData?.daily_average_gas_unit_price?.slice(-1)[0]
      ?.avg_gas_unit_price;
  const avgGasPrice = avgGasPriceRaw ? Number(avgGasPriceRaw) : undefined;

  // Extract chart data (last 14 days)
  const CHART_DAYS = 14;

  // Helper function to format date labels
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Transaction History chart data (14 days)
  const txHistoryChartData =
    analyticsData?.daily_user_transactions
      ?.slice(-CHART_DAYS)
      .map((d) => d.num_user_transactions) ?? [];
  const txHistoryChartLabels =
    analyticsData?.daily_user_transactions
      ?.slice(-CHART_DAYS)
      .map((d) => formatDateLabel(d.date)) ?? [];

  const isAnalyticsLoading = !analyticsData;

  return (
    <div className="min-h-screen">
      {/* Hero + Stats Section - Full Width */}
      <div className="relative overflow-x-clip overflow-y-visible">
        {/* Centered Glow above search bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-(--ms-accent)/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-100 h-50 bg-(--ms-accent-2)/12 blur-[100px] rounded-full pointer-events-none" />

        {/* Hero Section - Content with container */}
        <section className="relative pt-10 md:pt-10 z-20">
          <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-10 relative">
            <div className="max-w-230 space-y-3">
              {/* Hero Title */}
              <h1 className="text-2xl md:text-[32px] md:leading-tight font-semibold text-foreground font-heading">
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
        <div className="relative z-10 container max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Desktop: 2 rows - Metrics on left (60%), Chart on right (40%) */}
          {/* Mobile/Tablet: Stacked vertically */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 lg:gap-6">
            {/* Left: 6 Core Metrics Grid */}
            <div className="min-w-0">
              <CoreMetricsGrid
                movePrice={priceData?.price ?? undefined}
                priceChange24h={priceData?.priceChange24h ?? undefined}
                marketCap={priceData?.marketCap ?? undefined}
                totalTransactions={totalTransactions}
                totalAccounts={totalAccounts}
                peakTps={peakTps}
                avgGasPrice={avgGasPrice}
                isLoading={ledgerLoading || isAnalyticsLoading || priceLoading}
              />
            </div>

            {/* Right: Transaction History Chart */}
            <div className="w-full lg:w-100 xl:w-[480px] h-60">
              <TransactionHistoryChart
                chartData={txHistoryChartData}
                chartLabels={txHistoryChartLabels}
                isLoading={isAnalyticsLoading}
              />
            </div>
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
