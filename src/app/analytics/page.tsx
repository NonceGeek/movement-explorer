"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useState } from "react";
import { useGetAnalyticsData } from "@/hooks/analytics/useGetAnalyticsData";
import { Skeleton } from "@/components/ui/skeleton";
import NetworkInfo from "./components/NetworkInfo";
import ChartRangeDaysSelect, {
  ChartRangeDays,
} from "./components/ChartRangeDaysSelect";
import DailyUserTransactionsChart from "./components/charts/DailyUserTransactionsChart";
import DailyPeakTPSChart from "./components/charts/DailyPeakTPSChart";
import MonthlyActiveUserChart from "./components/charts/MonthlyActiveUserChart";
import DailyActiveUserChart from "./components/charts/DailyActiveUserChart";
import DailyNewAccountsCreatedChart from "./components/charts/DailyNewAccountsCreatedChart";
import DailyDeployedContractsChart from "./components/charts/DailyDeployedContractsChart";
import DailyContractDeployersChart from "./components/charts/DailyContractDeployersChart";
import DailyGasConsumptionChart from "./components/charts/DailyGasConsumptionChart";
import DailyAvgGasUnitPriceChart from "./components/charts/DailyAvgGasUnitPriceChart";

export default function AnalyticsPage() {
  const [days, setDays] = useState<ChartRangeDays>(
    ChartRangeDays.DEFAULT_RANGE
  );
  const data = useGetAnalyticsData();

  return (
    <>
      <PageNavigation title="Analytics" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Network Analytics</h1>

        {/* Network Info Metrics */}
        <NetworkInfo />

        {/* Chart Range Selector */}
        <div className="mb-6">
          <ChartRangeDaysSelect days={days} setDays={setDays} />
        </div>

        {/* Charts Grid */}
        {!data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DailyUserTransactionsChart
              data={data.daily_user_transactions}
              days={days}
            />
            <DailyPeakTPSChart
              data={data.daily_max_tps_15_blocks}
              days={days}
            />
            <MonthlyActiveUserChart data={data.mau_signers} days={days} />
            <DailyActiveUserChart data={data.daily_active_users} days={days} />
            <DailyNewAccountsCreatedChart
              data={data.daily_new_accounts_created}
              days={days}
            />
            <DailyDeployedContractsChart
              data={data.daily_deployed_contracts}
              days={days}
            />
            <DailyContractDeployersChart
              data={data.daily_contract_deployers}
              days={days}
            />
            <DailyGasConsumptionChart
              data={data.daily_gas_from_user_transactions}
              days={days}
            />
            <DailyAvgGasUnitPriceChart
              data={data.daily_average_gas_unit_price}
              days={days}
            />
          </div>
        )}
      </div>
    </>
  );
}
