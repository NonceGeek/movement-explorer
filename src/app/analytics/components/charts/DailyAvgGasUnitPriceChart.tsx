"use client";

import { DailyAvgGasData } from "@/hooks/analytics/useGetAnalyticsData";
import { getLabels, getFormattedBalanceStr } from "../../utils";
import { ChartRangeDays } from "../ChartRangeDaysSelect";
import ChartTitle from "../ChartTitle";
import ChartCard from "../ChartCard";
import LineChart from "../LineChart";

function getDataset(data: DailyAvgGasData[], days: number): number[] {
  return data
    .slice(-days)
    .map((dailyData) => Number(dailyData.avg_gas_unit_price));
}

type DailyAvgGasUnitPriceChartProps = {
  data: DailyAvgGasData[];
  days: ChartRangeDays;
};

export default function DailyAvgGasUnitPriceChart({
  data,
  days,
}: DailyAvgGasUnitPriceChartProps) {
  const labels = getLabels(data, days);
  const dataset = getDataset(data, days);

  return (
    <ChartCard>
      <ChartTitle
        label="Average Gas Unit Price"
        tooltip="Daily average gas unit price on user transactions."
      />
      <LineChart
        labels={labels}
        dataset={dataset}
        fill
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tooltipsLabelFunc={(context: any) => {
          const priceInteger = Math.round(context.parsed.y).toString();
          const priceInMOVE = getFormattedBalanceStr(priceInteger, 8);
          return `${priceInMOVE} MOVE`;
        }}
      />
    </ChartCard>
  );
}
