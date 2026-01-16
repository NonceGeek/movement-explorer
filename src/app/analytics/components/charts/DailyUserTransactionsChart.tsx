"use client";

import { DailyUserTxnData } from "@/hooks/analytics/useGetAnalyticsData";
import { getLabels } from "../../utils";
import { ChartRangeDays } from "../ChartRangeDaysSelect";
import ChartTitle from "../ChartTitle";
import ChartCard from "../ChartCard";
import LineChart from "../LineChart";

function getDataset(data: DailyUserTxnData[], days: number): number[] {
  return data.slice(-days).map((dailyData) => dailyData.num_user_transactions);
}

type DailyUserTransactionsChartProps = {
  data: DailyUserTxnData[];
  days: ChartRangeDays;
};

export default function DailyUserTransactionsChart({
  data,
  days,
}: DailyUserTransactionsChartProps) {
  const labels = getLabels(data, days);
  const dataset = getDataset(data, days);

  return (
    <ChartCard>
      <ChartTitle
        label="User Transactions"
        tooltip="Daily transaction count of user transactions."
      />
      <LineChart labels={labels} dataset={dataset} />
    </ChartCard>
  );
}
