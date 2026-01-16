"use client";

import { DailyGasCostData } from "@/hooks/analytics/useGetAnalyticsData";
import { getLabels, getFormattedBalanceStr } from "../../utils";
import { ChartRangeDays } from "../ChartRangeDaysSelect";
import ChartTitle from "../ChartTitle";
import ChartCard from "../ChartCard";
import LineChart from "../LineChart";

function getDataset(data: DailyGasCostData[], days: number): number[] {
  return data.slice(-days).map((dailyData) => Number(dailyData.gas_cost));
}

type DailyGasConsumptionChartProps = {
  data: DailyGasCostData[];
  days: ChartRangeDays;
};

export default function DailyGasConsumptionChart({
  data,
  days,
}: DailyGasConsumptionChartProps) {
  const labels = getLabels(data, days);
  const dataset = getDataset(data, days);

  return (
    <ChartCard>
      <ChartTitle
        label="Gas Consumption"
        tooltip="Daily gas on user transactions."
      />
      <LineChart
        labels={labels}
        dataset={dataset}
        fill
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tooltipsLabelFunc={(context: any) => {
          const priceInteger = Math.round(context.parsed.y).toString();
          const priceInMOVE = getFormattedBalanceStr(priceInteger, 0);
          return `${priceInMOVE} MOVE`;
        }}
      />
    </ChartCard>
  );
}
