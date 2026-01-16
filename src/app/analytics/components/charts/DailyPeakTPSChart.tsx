"use client";

import { DailyPeakTPSData } from "@/hooks/analytics/useGetAnalyticsData";
import { getLabels } from "../../utils";
import { ChartRangeDays } from "../ChartRangeDaysSelect";
import ChartTitle from "../ChartTitle";
import ChartCard from "../ChartCard";
import LineChart from "../LineChart";

function getDataset(data: DailyPeakTPSData[], days: number): number[] {
  return data.slice(-days).map((dailyData) => dailyData.max_tps_15_blocks);
}

type DailyPeakTPSChartProps = {
  data: DailyPeakTPSData[];
  days: ChartRangeDays;
};

export default function DailyPeakTPSChart({
  data,
  days,
}: DailyPeakTPSChartProps) {
  const labels = getLabels(data, days);
  const dataset = getDataset(data, days);

  return (
    <ChartCard>
      <ChartTitle
        label="Max TPS"
        tooltip="Daily highest rate of transactions in a block on a given day, divided by the duration of that block in seconds."
      />
      <LineChart labels={labels} dataset={dataset} />
    </ChartCard>
  );
}
