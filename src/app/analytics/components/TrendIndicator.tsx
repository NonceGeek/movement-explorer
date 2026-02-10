"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/utils/styling";

export interface TrendIndicatorProps {
  value: number; // Percentage value (e.g., 2.5 for 2.5%)
  className?: string;
  showZero?: boolean; // Whether to show indicator when value is 0
}

/**
 * TrendIndicator - Shows ↑/↓ arrow with percentage change
 * Green for positive trends, red for negative trends
 * Inspired by Etherscan's metric cards
 */
export default function TrendIndicator({
  value,
  className,
  showZero = false,
}: TrendIndicatorProps) {
  // Don't show anything if value is 0 and showZero is false
  if (value === 0 && !showZero) {
    return null;
  }

  const isPositive = value >= 0;
  const displayValue = Math.abs(value).toFixed(1);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 text-base font-semibold",
        isPositive
          ? "text-guild-green-500 dark:text-guild-green-400"
          : "text-oracle-orange-500 dark:text-oracle-orange-400",
        className,
      )}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span>{displayValue}%</span>
    </div>
  );
}
