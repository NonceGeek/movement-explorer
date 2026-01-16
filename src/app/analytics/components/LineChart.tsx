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
import { BACKGROUND_COLOR, COLOR, HIGHLIGHT_COLOR } from "../utils";

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
  fill,
  tooltipsLabelFunc,
}: LineChartProps) {
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
        callbacks: {
          label: tooltipsLabelFunc,
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
    elements: {
      point: {
        pointStyle: "circle" as const,
        pointBackgroundColor: HIGHLIGHT_COLOR,
        borderWidth: 0,
        radius: 3,
        hoverRadius: 4,
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
        backgroundColor: BACKGROUND_COLOR,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="h-[120px]">
      <Line options={options} data={data} />
    </div>
  );
}
