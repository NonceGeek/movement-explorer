"use client";

import { DailyContractData } from "@/hooks/analytics/useGetAnalyticsData";
import { getLabels } from "../../utils";
import { ChartRangeDays } from "../ChartRangeDaysSelect";
import ChartTitle from "../ChartTitle";
import ChartCard from "../ChartCard";
import BarChart from "../BarChart";

function getDataset(data: DailyContractData[], days: number): number[] {
  return data
    .slice(-days)
    .map((dailyData) => dailyData.daily_contract_deployed);
}

type DailyDeployedContractsChartProps = {
  data: DailyContractData[];
  days: ChartRangeDays;
};

export default function DailyDeployedContractsChart({
  data,
  days,
}: DailyDeployedContractsChartProps) {
  const labels = getLabels(data, days);
  const dataset = getDataset(data, days);

  return (
    <ChartCard>
      <ChartTitle
        label="Deployed Contracts"
        tooltip="Daily count of move modules."
      />
      <BarChart labels={labels} dataset={dataset} />
    </ChartCard>
  );
}
