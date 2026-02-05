"use client";

import { cn } from "@/utils/styling";
import { ChartRangeDays } from "./ChartRangeDaysSelect";

interface SectionHeaderProps {
  title: string;
  days: ChartRangeDays;
  onDaysChange: (days: ChartRangeDays) => void;
}

/**
 * SectionHeader - Section title with day range toggle
 * Features:
 * - Section title on the left
 * - 7 days / 30 days toggle on the right
 * - Smooth transition effects
 */
export default function SectionHeader({
  title,
  days,
  onDaysChange,
}: SectionHeaderProps) {
  const isDefaultRange = days === ChartRangeDays.DEFAULT_RANGE;

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold">{title}</h2>

      {/* Day Range Toggle with Sliding Background */}
      <div className="relative flex items-center gap-1 bg-muted/50 rounded-md p-1">
        {/* Sliding Background Indicator */}
        <div
          className={cn(
            "absolute h-[calc(100%-8px)] rounded transition-all duration-300 ease-out bg-primary shadow-sm",
            "top-1",
            isDefaultRange
              ? "left-1 w-[calc(50%-6px)]"
              : "left-[calc(50%+2px)] w-[calc(50%-6px)]"
          )}
        />

        {/* Buttons */}
        <button
          onClick={() => onDaysChange(ChartRangeDays.DEFAULT_RANGE)}
          className={cn(
            "relative z-10 px-3 py-1 text-xs font-medium rounded transition-all duration-300 cursor-pointer flex-1 whitespace-nowrap",
            isDefaultRange
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          7 Days
        </button>
        <button
          onClick={() => onDaysChange(ChartRangeDays.FULL_RANGE)}
          className={cn(
            "relative z-10 px-3 py-1 text-xs font-medium rounded transition-all duration-300 cursor-pointer flex-1 whitespace-nowrap",
            !isDefaultRange
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          30 Days
        </button>
      </div>
    </div>
  );
}
