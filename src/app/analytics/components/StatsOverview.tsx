"use client";

import {
  Activity,
  Users,
  Code,
  TrendingUp,
  Gauge,
  Wallet,
  FileCode,
  Fuel,
  UserPlus,
  BarChart3,
} from "lucide-react";
import EnhancedMetricCard from "./EnhancedMetricCard";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import type { AnalyticsData } from "@/hooks/analytics/useGetAnalyticsData";

interface StatsOverviewProps {
  data: AnalyticsData | undefined;
  ledgerVersion?: string;
  peakTps?: number;
}

function getFormattedTPS(tps: number) {
  const tpsWithDecimal = parseFloat(tps.toFixed(0));
  return tpsWithDecimal.toLocaleString("en-US");
}

/**
 * StatsOverview - Unified stats grid displaying all key metrics
 * Features:
 * - Responsive grid: 1-col mobile → 2-col tablet → 4-col desktop
 * - All key metrics from analytics data
 * - Loading states with EnhancedSkeleton
 * - Icons for visual hierarchy
 */
export default function StatsOverview({
  data,
  ledgerVersion,
  peakTps,
}: StatsOverviewProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 10 }).map((_, i) => (
          <EnhancedSkeleton key={i} className="h-[140px]" />
        ))}
      </div>
    );
  }

  // Get latest values from arrays
  const latestDailyActiveUsers =
    data.daily_active_users?.[data.daily_active_users.length - 1]
      ?.daily_active_user_count;
  const latestMonthlyActiveUsers =
    data.mau_signers?.[data.mau_signers.length - 1]?.mau_signer_30;
  const latestDailyTransactions =
    data.daily_user_transactions?.[data.daily_user_transactions.length - 1]
      ?.num_user_transactions;
  const latestNewAccounts =
    data.daily_new_accounts_created?.[
      data.daily_new_accounts_created.length - 1
    ]?.new_account_count;
  const latestAvgGasPrice =
    data.daily_average_gas_unit_price?.[
      data.daily_average_gas_unit_price.length - 1
    ]?.avg_gas_unit_price;
  const latestDeployedContracts =
    data.daily_deployed_contracts?.[data.daily_deployed_contracts.length - 1]
      ?.daily_contract_deployed;

  const metrics = [
    {
      id: "total-txns",
      data: ledgerVersion ? parseInt(ledgerVersion).toLocaleString("en-US") : "-",
      label: "Total Transactions",
      tooltip: "Total transactions on Movement network since genesis.",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      id: "peak-tps",
      data: peakTps ? getFormattedTPS(peakTps) : "-",
      label: "Peak TPS (30 Days)",
      tooltip:
        "The highest count of user transactions within any two-block interval on a given day, divided by the duration (in seconds) of that interval.",
      icon: <Gauge className="h-5 w-5" />,
    },
    {
      id: "total-accounts",
      data: data.total_accounts?.[0]?.total_accounts?.toLocaleString("en-US") ?? "-",
      label: "Total Accounts",
      tooltip: "Total accounts created on Movement network.",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      id: "deployed-contracts",
      data:
        data.cumulative_deployers?.[0]?.cumulative_contracts_deployed?.toLocaleString(
          "en-US"
        ) ?? "-",
      label: "Total Deployed Contracts",
      tooltip: "Total Move modules deployed on Movement network.",
      icon: <FileCode className="h-5 w-5" />,
    },
    {
      id: "contract-deployers",
      data:
        data.cumulative_deployers?.[0]?.cumulative_contract_deployers?.toLocaleString(
          "en-US"
        ) ?? "-",
      label: "Total Contract Deployers",
      tooltip: "Total distinct addresses that have deployed Move modules.",
      icon: <Code className="h-5 w-5" />,
    },
    {
      id: "daily-active-users",
      data: latestDailyActiveUsers?.toLocaleString("en-US") ?? "-",
      label: "Daily Active Users",
      tooltip:
        "Number of unique accounts that have submitted at least one user transaction on the latest day.",
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: "monthly-active-users",
      data: latestMonthlyActiveUsers?.toLocaleString("en-US") ?? "-",
      label: "Monthly Active Users",
      tooltip:
        "Number of unique accounts that have submitted at least one user transaction in the past 30 days.",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      id: "daily-transactions",
      data: latestDailyTransactions?.toLocaleString("en-US") ?? "-",
      label: "Daily Transactions",
      tooltip: "Number of user transactions submitted on the latest day.",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      id: "daily-new-accounts",
      data: latestNewAccounts?.toLocaleString("en-US") ?? "-",
      label: "Daily New Accounts",
      tooltip: "Number of new accounts created on the latest day.",
      icon: <UserPlus className="h-5 w-5" />,
    },
    {
      id: "avg-gas-price",
      data: latestAvgGasPrice
        ? parseFloat(latestAvgGasPrice).toFixed(2)
        : "-",
      label: "Avg Gas Unit Price",
      tooltip: "Average gas unit price for user transactions on the latest day.",
      icon: <Fuel className="h-5 w-5" />,
    },
    {
      id: "daily-deployed-contracts",
      data: latestDeployedContracts?.toLocaleString("en-US") ?? "-",
      label: "Daily Deployed Contracts",
      tooltip: "Number of Move modules deployed on the latest day.",
      icon: <Code className="h-5 w-5" />,
    },
  ];

  return (
    <section id="section-overview" className="scroll-mt-6">
      <h2 className="text-2xl font-bold mb-4">Network Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <EnhancedMetricCard
            key={metric.id}
            data={metric.data}
            label={metric.label}
            tooltip={metric.tooltip}
            icon={metric.icon}
            size="lg"
          />
        ))}
      </div>
    </section>
  );
}
