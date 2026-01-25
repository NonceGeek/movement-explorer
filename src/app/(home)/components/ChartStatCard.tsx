"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip
);

// Chart colors - teal/cyan theme
const LINE_COLOR = "rgba(45, 212, 191, 0.9)";
const GRADIENT_START = "rgba(45, 212, 191, 0.35)";
const GRADIENT_END = "rgba(45, 212, 191, 0.02)";

export interface ChartStatCardProps {
  label: string;
  value: string | number;
  tooltip?: string;
  isLoading?: boolean;
  chartData: number[];
  chartLabels: string[];
}

function formatNumber(num: number | string): string {
  return Number(num).toLocaleString();
}

// Format Y axis values with K/M suffix
function formatYAxisValue(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(0) + "M";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + "k";
  }
  return value.toString();
}

export function ChartStatCard({
  label,
  value,
  tooltip,
  isLoading,
  chartData,
  chartLabels,
}: ChartStatCardProps) {
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 4,
          maxRotation: 0,
          color: "rgba(156, 163, 175, 0.6)",
          font: {
            size: 10,
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
          display: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 3,
          color: "rgba(156, 163, 175, 0.6)",
          font: {
            size: 10,
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
        hoverRadius: 4,
        backgroundColor: LINE_COLOR,
      },
      line: {
        borderWidth: 1,
      },
    },
  };

  const data = {
    labels: chartLabels,
    datasets: [
      {
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

  return (
    <div className="p-4 sm:p-5 h-full flex flex-col bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
      {/* Header: Label & Tooltip */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium tracking-wider">
          {label.toUpperCase()}
        </span>
        {tooltip && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  size={13}
                  className="text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors"
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-60 text-xs leading-relaxed"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-[24px] sm:text-[28px] font-semibold font-mono text-foreground leading-tight">
            {typeof value === "number" ? formatNumber(value) : value}
          </div>
        )}
      </div>

      {/* Chart - takes remaining space */}
      <div className="flex-1 min-h-[80px]">
        {chartData.length > 0 ? (
          <Line options={options} data={data} />
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
    </div>
  );
}

