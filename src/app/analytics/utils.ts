import { DailyAnalyticsData } from "@/hooks/analytics/useGetAnalyticsData";

// Chart colors are derived from the resolved theme, mirroring the values
// in src/styles/theme.css. We can't read CSS variables via getComputedStyle
// during React render because next-themes applies the .dark class via an
// effect that hasn't committed yet, so reads return stale values.
// Keeping the values inline (synced with theme.css) is the most reliable
// path for canvas-based chart libraries.
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Tokens = {
  accent: string;
  accent2: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  card: string;
};

const LIGHT_TOKENS: Tokens = {
  accent:  "#7A4B1F",
  accent2: "#B06A2C",
  ink:     "#1D1B16",
  ink2:    "#4A463C",
  ink3:    "#807A6B",
  line:    "#E7E0D2",
  card:    "#FFFFFF",
};

const DARK_TOKENS: Tokens = {
  accent:  "#FAF7F2",
  accent2: "#FFFFFF",
  ink:     "#FAF7F2",
  ink2:    "#B4AD9C",
  ink3:    "#807A6B",
  line:    "#26221A",
  card:    "#161410",
};

export type ChartColors = {
  // Primary series
  COLOR: string;
  BACKGROUND_COLOR: string;       // gradient stop 0  (top, most opaque)
  BACKGROUND_COLOR_MID: string;   // gradient stop ~0.6
  BACKGROUND_COLOR_END: string;   // gradient stop 1  (bottom, transparent)
  // Secondary series (for multi-line / multi-bar charts)
  SECONDARY_COLOR: string;
  SECONDARY_BG: string;
  SECONDARY_BG_END: string;
  // Tertiary (neutral, for comparison)
  TERTIARY_COLOR: string;
  // Hover marker
  HIGHLIGHT_COLOR: string;
  // Axis & grid
  GRID_LINE_COLOR: string;
  AXIS_LABEL_COLOR: string;
  // Tooltip (theme-aware so it works in both modes)
  TOOLTIP_BG: string;
  TOOLTIP_FG: string;
  TOOLTIP_BORDER: string;
};

export function getChartColors(resolvedTheme?: string): ChartColors {
  const t = resolvedTheme === "dark" ? DARK_TOKENS : LIGHT_TOKENS;
  const { accent, accent2, ink, ink2, ink3, line, card } = t;

  return {
    COLOR:                hexToRgba(accent, 1.0),
    BACKGROUND_COLOR:     hexToRgba(accent, 0.55),
    BACKGROUND_COLOR_MID: hexToRgba(accent, 0.14),
    BACKGROUND_COLOR_END: hexToRgba(accent, 0),

    SECONDARY_COLOR:    hexToRgba(accent2, 1.0),
    SECONDARY_BG:       hexToRgba(accent2, 0.4),
    SECONDARY_BG_END:   hexToRgba(accent2, 0),

    TERTIARY_COLOR: hexToRgba(ink2, 0.85),

    HIGHLIGHT_COLOR: accent2,

    GRID_LINE_COLOR:   hexToRgba(line, 0.55),
    AXIS_LABEL_COLOR:  hexToRgba(ink3, 0.85),

    TOOLTIP_BG:     hexToRgba(card, 0.95),
    TOOLTIP_FG:     ink,
    TOOLTIP_BORDER: hexToRgba(accent, 0.4),
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
