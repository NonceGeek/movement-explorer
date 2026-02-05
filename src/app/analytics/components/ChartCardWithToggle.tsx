"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/styling";
import { ChartRangeDays } from "./ChartRangeDaysSelect";

interface ChartCardWithToggleProps {
  title: string;
  children: (days: ChartRangeDays) => React.ReactNode;
  defaultDays?: ChartRangeDays;
  className?: string;
}

/**
 * ChartCardWithToggle - Chart card with individual day range toggle
 * Features:
 * - 7 days / 30 days toggle in card header
 * - Each chart has independent day range state
 * - Sui-inspired interaction design
 */
export default function ChartCardWithToggle({
  title,
  children,
  defaultDays = ChartRangeDays.DEFAULT_RANGE,
  className,
}: ChartCardWithToggleProps) {
  const [days, setDays] = React.useState<ChartRangeDays>(defaultDays);

  return (
    <Card
      className={cn(
        "border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {/* Card Header with Title and Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <h3 className="text-sm font-semibold">{title}</h3>

        {/* Day Range Toggle */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
          <button
            onClick={() => setDays(ChartRangeDays.DEFAULT_RANGE)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-all duration-200",
              days === ChartRangeDays.DEFAULT_RANGE
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            7 Days
          </button>
          <button
            onClick={() => setDays(ChartRangeDays.FULL_RANGE)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-all duration-200",
              days === ChartRangeDays.FULL_RANGE
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-4">{children(days)}</div>
    </Card>
  );
}
