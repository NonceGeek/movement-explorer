import { DailyAnalyticsData } from "@/hooks/analytics/useGetAnalyticsData";

// Chart colors
export const COLOR = "rgba(129, 140, 248, 0.6)";
export const BACKGROUND_COLOR = "rgba(129, 140, 248, 0.4)";
export const HIGHLIGHT_COLOR = "#A5B4FC";

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
