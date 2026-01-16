"use client";

import { MonthlyActiveUserData } from "@/hooks/analytics/useGetAnalyticsData";
import { getLabels } from "../../utils";
import { ChartRangeDays } from "../ChartRangeDaysSelect";
import ChartTitle from "../ChartTitle";
import ChartCard from "../ChartCard";
import LineChart from "../LineChart";

function getDataset(data: MonthlyActiveUserData[], days: number): number[] {
  return data.slice(-days).map((dailyData) => dailyData.mau_signer_30);
}

type MonthlyActiveUserChartProps = {
  data: MonthlyActiveUserData[];
  days: ChartRangeDays;
};

export default function MonthlyActiveUserChart({
  data,
  days,
}: MonthlyActiveUserChartProps) {
  const labels = getLabels(data, days);
  const dataset = getDataset(data, days);

  return (
    <ChartCard>
      <ChartTitle
        label="Monthly Active Accounts"
        tooltip="Daily count of distinct addresses with signed transactions over the last 30 days."
      />
      <LineChart labels={labels} dataset={dataset} decimals={1} />
    </ChartCard>
  );
}
