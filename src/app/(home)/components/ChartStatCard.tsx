"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
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
import { useMemo } from "react";
import { useTheme } from "next-themes";
import { getChartColors } from "@/app/analytics/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip
);

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
  const { resolvedTheme } = useTheme();
  const colors = useMemo(() => getChartColors(resolvedTheme), [resolvedTheme]);
  const {
    COLOR: LINE_COLOR,
    BACKGROUND_COLOR: GRADIENT_START,
    BACKGROUND_COLOR_MID: GRADIENT_MID,
    BACKGROUND_COLOR_END: GRADIENT_END,
    TOOLTIP_BG,
    TOOLTIP_FG,
    TOOLTIP_BORDER,
  } = colors;

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
        backgroundColor: TOOLTIP_BG,
        titleColor: TOOLTIP_FG,
        bodyColor: TOOLTIP_FG,
        borderColor: TOOLTIP_BORDER,
        borderWidth: 1,
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
          color: "rgb(153, 153, 153)",
          font: {
            size: 14,
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
          color: "rgb(153, 153, 153)",
          font: {
            size: 14,
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
          gradient.addColorStop(0.6, GRADIENT_MID);
          gradient.addColorStop(1, GRADIENT_END);
          return gradient;
        },
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="p-4 md:p-5 h-full flex flex-col bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
      {/* Header: Label & Tooltip */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs text-muted-foreground font-medium tracking-wider">
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
      <div className="mb-2">
        {isLoading ? (
          <EnhancedSkeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground leading-tight">
            {typeof value === "number" ? formatNumber(value) : value}
          </div>
        )}
      </div>

      {/* Chart - takes remaining space */}
      <div className="flex-1 min-h-[80px]">
        {chartData.length > 0 ? (
          <Line key={resolvedTheme} options={options} data={data} />
        ) : (
          <EnhancedSkeleton className="h-full w-full" />
        )}
      </div>
    </div>
  );
}

