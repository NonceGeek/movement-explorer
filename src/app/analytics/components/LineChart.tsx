"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import { getChartColors } from "../utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

type LineChartProps = {
  labels: string[];
  dataset: number[];
  fill?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tooltipsLabelFunc?: (context: any) => string;
  decimals?: number;
};

export default function LineChart({
  labels,
  dataset,
  fill = true,
  tooltipsLabelFunc,
}: LineChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = useMemo(() => getChartColors(), [resolvedTheme]);
  const {
    COLOR,
    BACKGROUND_COLOR,
    BACKGROUND_COLOR_MID,
    BACKGROUND_COLOR_END,
    HIGHLIGHT_COLOR,
    GRID_LINE_COLOR,
    AXIS_LABEL_COLOR,
    TOOLTIP_BG,
    TOOLTIP_FG,
    TOOLTIP_BORDER,
  } = colors;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const, // Show tooltip for all datasets at same index
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        usePointStyle: true,
        backgroundColor: TOOLTIP_BG,
        titleColor: TOOLTIP_FG,
        bodyColor: TOOLTIP_FG,
        padding: 12,
        borderColor: TOOLTIP_BORDER,
        borderWidth: 1,
        callbacks: {
          label: tooltipsLabelFunc,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true, // Show grid lines (Etherscan style)
          color: GRID_LINE_COLOR,
          lineWidth: 1,
          drawTicks: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 4,
          maxRotation: 0,
          color: AXIS_LABEL_COLOR,
        },
        border: {
          display: false,
        },
      },
      y: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 3,
          color: AXIS_LABEL_COLOR,
        },
        grid: {
          display: true, // Show grid lines (Etherscan style)
          color: GRID_LINE_COLOR,
          lineWidth: 1,
          drawTicks: false,
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        pointStyle: "circle" as const,
        pointBackgroundColor: HIGHLIGHT_COLOR,
        borderWidth: 0,
        radius: 3,
        hoverRadius: 5,
        hoverBorderWidth: 2,
        hoverBorderColor: TOOLTIP_BG,
      },
    },
  };

  const data = {
    labels,
    datasets: [
      {
        label: "",
        fill: fill,
        data: dataset,
        borderColor: COLOR,
        // Gradient fill (Etherscan style)
        backgroundColor: (context: any) => {
          if (!fill) return undefined;
          const ctx = context.chart.ctx;
          const chartArea = context.chart.chartArea;
          if (!chartArea) return undefined;

          // Create gradient from top to bottom of chart area
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          gradient.addColorStop(0, BACKGROUND_COLOR);     // strong top
          gradient.addColorStop(0.6, BACKGROUND_COLOR_MID); // soft mid
          gradient.addColorStop(1, BACKGROUND_COLOR_END);   // fully transparent
          return gradient;
        },
        tension: 0.4, // Smooth curves
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="h-[120px]">
      <Line key={resolvedTheme} options={options} data={data} />
    </div>
  );
}
