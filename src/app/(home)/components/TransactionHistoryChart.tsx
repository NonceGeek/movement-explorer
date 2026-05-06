"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend
);

// Chart colors
const LINE_COLOR = "rgba(88, 197, 137, 0.9)";
const GRADIENT_START = "rgba(88, 197, 137, 0.3)";
const GRADIENT_END = "rgba(88, 197, 137, 0.02)";
const GRID_LINE_COLOR = "rgba(156, 163, 175, 0.1)";

interface TransactionHistoryChartProps {
  chartData: number[];
  chartLabels: string[];
  isLoading?: boolean;
}

// Format Y axis values with K/M suffix
function formatYAxisValue(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + "K";
  }
  return value.toString();
}

/**
 * TransactionHistoryChart - 14-day transaction history chart
 * Displays as area chart with gradient fill
 */
export function TransactionHistoryChart({
  chartData,
  chartLabels,
  isLoading,
}: TransactionHistoryChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        borderColor: "rgba(88, 197, 137, 0.3)",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return `Transactions: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: GRID_LINE_COLOR,
          lineWidth: 1,
          drawTicks: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 7,
          maxRotation: 0,
          color: "rgba(156, 163, 175, 0.8)",
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        display: true,
        position: "right" as const,
        grid: {
          display: true,
          color: GRID_LINE_COLOR,
          lineWidth: 1,
          drawTicks: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 5,
          color: "rgba(156, 163, 175, 0.8)",
          font: {
            size: 11,
          },
          callback: function (tickValue: string | number) {
            return formatYAxisValue(Number(tickValue));
          },
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
        hoverBorderWidth: 2,
        hoverBorderColor: "#fff",
        backgroundColor: LINE_COLOR,
      },
      line: {
        borderWidth: 2,
      },
    },
  };

  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: "Transactions",
        data: chartData,
        borderColor: LINE_COLOR,
        backgroundColor: (context: { chart: ChartJS }) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return GRADIENT_START;
          }
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          gradient.addColorStop(0, GRADIENT_START);
          gradient.addColorStop(1, GRADIENT_END);
          return gradient;
        },
        fill: true,
        tension: 0.4,
      },
    ],
  };

  if (isLoading || chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EnhancedSkeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="h-full bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4">
      {/* Chart Title */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-muted-foreground tracking-wider">
          TRANSACTION HISTORY (14 DAYS)
        </h3>
      </div>

      {/* Chart */}
      <div className="h-[calc(100%-36px)]">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
