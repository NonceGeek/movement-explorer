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
import { BACKGROUND_COLOR } from "../utils";

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
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
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
        labelPointStyle: {
          pointStyle: "circle" as const,
          rotation: 0,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 4,
          maxRotation: 0,
          color: "rgba(156, 163, 175, 0.8)",
        },
      },
      y: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 3,
          color: "rgba(156, 163, 175, 0.8)",
        },
        grid: {
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
        backgroundColor: BACKGROUND_COLOR,
      },
    ],
  };

  return (
    <div className="h-[120px]">
      <Bar options={options} data={data} />
    </div>
  );
}
