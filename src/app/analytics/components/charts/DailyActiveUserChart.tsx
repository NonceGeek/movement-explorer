"use client";

import { DailyActiveUserData } from "@/hooks/analytics/useGetAnalyticsData";
import { getLabels } from "../../utils";
import { ChartRangeDays } from "../ChartRangeDaysSelect";
import ChartTitle from "../ChartTitle";
import ChartCard from "../ChartCard";
import BarChart from "../BarChart";

function getDataset(data: DailyActiveUserData[], days: number): number[] {
  return data
    .slice(-days)
    .map((dailyData) => dailyData.daily_active_user_count);
}

type DailyActiveUserChartProps = {
  data: DailyActiveUserData[];
  days: ChartRangeDays;
};

export default function DailyActiveUserChart({
  data,
  days,
}: DailyActiveUserChartProps) {
  const labels = getLabels(data, days);
  const dataset = getDataset(data, days);

  return (
    <ChartCard>
      <ChartTitle
        label="Daily Active Accounts"
        tooltip="Daily count of distinct addresses with signed transactions."
      />
      <BarChart labels={labels} dataset={dataset} />
    </ChartCard>
  );
}
