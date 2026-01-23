"use client";

import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo } from "@/services/general";
import { useGlobalStore } from "@/store/useGlobalStore";
import { SearchBar } from "@/components/search";
import { StatCard } from "./components/StatCard";
import { LatestUserTransactions } from "./components/LatestUserTransactions";
import { useGetPeakTPS, useGetAnalyticsData } from "@/hooks";

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

  const isAnalyticsLoading = !analyticsData;

  return (
    <div className="min-h-screen">
      {/* Hero Section - Minimalist */}
      <section className="relative">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-moveus-marigold-950/10 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 py-4 sm:py-6 relative">
          <div className="max-w-230">
            <SearchBar
              variant="hero"
              placeholder="Search by Address / Txn Hash / Block / Token"
            />
          </div>
        </div>
      </section>

      {/* Network Stats */}
      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <StatCard
            label="Total Transactions"
            value={totalTransactions}
            tooltip="Total number of transactions on the Movement network."
            isLoading={ledgerLoading}
          />
          <StatCard
            label="Max TPS"
            value={peakTps ?? "-"}
            subLabel="Peak Last 30 Days"
            tooltip="The highest count of user transactions within any two-block interval on a given day, divided by the duration of that interval."
            isLoading={!peakTps && isAnalyticsLoading}
          />
          <StatCard
            label="Total Accounts"
            value={totalAccounts}
            tooltip="Total number of accounts created on the Movement network."
            isLoading={isAnalyticsLoading}
          />
          <StatCard
            label="Contracts Deployed"
            value={totalContracts}
            tooltip="Total number of smart contracts deployed on the network."
            isLoading={isAnalyticsLoading}
          />
          <StatCard
            label="Contract Deployers"
            value={totalDeployers}
            tooltip="Total number of unique addresses that have deployed contracts."
            isLoading={isAnalyticsLoading}
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
