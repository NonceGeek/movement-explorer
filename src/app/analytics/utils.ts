import { DailyAnalyticsData } from "@/hooks/analytics/useGetAnalyticsData";

// Chart colors are read from --ms-* CSS variables at runtime so charts
// follow the active light/dark theme. Chart libraries (Chart.js, Recharts)
// expect color strings, not CSS var references, so we resolve them on the
// fly via getComputedStyle and feed the resolved values into chart options.
function readVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export type ChartColors = {
  COLOR: string;
  BACKGROUND_COLOR: string;
  BACKGROUND_COLOR_END: string;
  HIGHLIGHT_COLOR: string;
  GRID_LINE_COLOR: string;
};

export function getChartColors(): ChartColors {
  // Fallbacks (light-mode --ms-* values) cover SSR and test contexts where
  // window/computed style aren't available.
  const accent = readVar("--ms-accent") || "#7A4B1F";
  const accent2 = readVar("--ms-accent-2") || "#B06A2C";
  const ink3 = readVar("--ms-ink-3") || "#807A6B";
  return {
    COLOR: `color-mix(in srgb, ${accent} 90%, transparent)`,
    BACKGROUND_COLOR: `color-mix(in srgb, ${accent} 40%, transparent)`,
    BACKGROUND_COLOR_END: `color-mix(in srgb, ${accent} 0%, transparent)`,
    HIGHLIGHT_COLOR: accent2,
    GRID_LINE_COLOR: `color-mix(in srgb, ${ink3} 25%, transparent)`,
  };
}

// Number formatter with K/M/G suffixes
export function numberFormatter(num: number, digits: number): string {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0";
}

// Extract date labels from analytics data
export function getLabels(data: DailyAnalyticsData[], days: number): string[] {
  return data.slice(-days).map((dailyData) => dailyData.date?.substring(5));
}

// Format balance string (for gas display)
export function getFormattedBalanceStr(
  balance: string,
  decimals: number
): string {
  const balanceNum = parseFloat(balance);
  if (decimals === 0) {
    return numberFormatter(balanceNum, 2);
  }
  const divisor = Math.pow(10, decimals);
  return (balanceNum / divisor).toFixed(decimals);
}
