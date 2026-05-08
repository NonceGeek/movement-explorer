"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import { getChartColors } from "../utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type BarChartProps = {
  labels: string[];
  dataset: number[];
};

export default function BarChart({ labels, dataset }: BarChartProps) {
  const { resolvedTheme } = useTheme();
  const { COLOR, BACKGROUND_COLOR, BACKGROUND_COLOR_END, GRID_LINE_COLOR } =
    useMemo(() => getChartColors(), [resolvedTheme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const,
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
        labelPointStyle: {
          pointStyle: "circle" as const,
          rotation: 0,
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
  };

  const data = {
    labels,
    datasets: [
      {
        label: "",
        data: dataset,
        // Gradient fill for bars (Etherscan style)
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, BACKGROUND_COLOR); // Top: more opaque
          gradient.addColorStop(1, BACKGROUND_COLOR_END); // Bottom: transparent
          return gradient;
        },
        borderColor: COLOR,
        borderWidth: 1.5,
        borderRadius: 4, // Rounded bars for modern look
        borderSkipped: false,
      },
    ],
  };

  return (
    <div className="h-[120px]">
      <Bar options={options} data={data} />
    </div>
  );
}
