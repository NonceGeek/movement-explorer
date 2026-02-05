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
import {
  BACKGROUND_COLOR,
  BACKGROUND_COLOR_END,
  COLOR,
  HIGHLIGHT_COLOR,
  GRID_LINE_COLOR,
} from "../utils";

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

/**
 * LineChart - Enhanced with Etherscan-style gradients and improved tooltips
 * Features:
 * - Guild Green gradient fills
 * - Subtle dashed grid lines
 * - Enhanced tooltips with context
 */
export default function LineChart({
  labels,
  dataset,
  fill = true, // Enable gradient fill by default (Etherscan style)
  tooltipsLabelFunc,
}: LineChartProps) {
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        borderColor: "rgba(88, 197, 137, 0.3)",
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
          color: "rgba(156, 163, 175, 0.8)",
        },
        border: {
          display: false,
        },
      },
      y: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 3,
          color: "rgba(156, 163, 175, 0.8)",
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
        hoverBorderColor: "#fff",
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
          gradient.addColorStop(0, BACKGROUND_COLOR); // Top: more opaque
          gradient.addColorStop(1, BACKGROUND_COLOR_END); // Bottom: transparent
          return gradient;
        },
        tension: 0.4, // Smooth curves
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="h-[120px]">
      <Line options={options} data={data} />
    </div>
  );
}
