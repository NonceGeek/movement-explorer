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
  const colors = useMemo(() => getChartColors(resolvedTheme), [resolvedTheme]);
  const {
    COLOR,
    BACKGROUND_COLOR,
    BACKGROUND_COLOR_MID,
    BACKGROUND_COLOR_END,
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
        backgroundColor: TOOLTIP_BG,
        titleColor: TOOLTIP_FG,
        bodyColor: TOOLTIP_FG,
        padding: 12,
        borderColor: TOOLTIP_BORDER,
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
          gradient.addColorStop(0, BACKGROUND_COLOR);     // strong top
          gradient.addColorStop(0.6, BACKGROUND_COLOR_MID); // soft mid
          gradient.addColorStop(1, BACKGROUND_COLOR_END);   // fully transparent
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
      <Bar key={resolvedTheme} options={options} data={data} />
    </div>
  );
}
