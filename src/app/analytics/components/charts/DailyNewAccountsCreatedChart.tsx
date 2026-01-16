"use client";

import { DailyNewAccountData } from "@/hooks/analytics/useGetAnalyticsData";
import { getLabels } from "../../utils";
import { ChartRangeDays } from "../ChartRangeDaysSelect";
import ChartTitle from "../ChartTitle";
import ChartCard from "../ChartCard";
import BarChart from "../BarChart";

function getDataset(data: DailyNewAccountData[], days: number): number[] {
  return data.slice(-days).map((dailyData) => dailyData.new_account_count);
}

type DailyNewAccountsCreatedChartProps = {
  data: DailyNewAccountData[];
  days: ChartRangeDays;
};

export default function DailyNewAccountsCreatedChart({
  data,
  days,
}: DailyNewAccountsCreatedChartProps) {
  const labels = getLabels(data, days);
  const dataset = getDataset(data, days);

  return (
    <ChartCard>
      <ChartTitle
        label="New Accounts Created"
        tooltip="Daily instances of distinct addresses getting coin balance for the first time."
      />
      <BarChart labels={labels} dataset={dataset} />
    </ChartCard>
  );
}
