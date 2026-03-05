"use client";

import { useState } from "react";
import { cn } from "@/utils/styling";

export interface DateRange {
  from: string | null; // ISO date string
  to: string | null;
}

const QUICK_OPTIONS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const isActive = value.from !== null || value.to !== null;

  const handleQuick = (hours: number) => {
    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    onChange({ from: from.toISOString(), to: now.toISOString() });
    setShowCustom(false);
  };

  const handleClear = () => {
    onChange({ from: null, to: null });
    setShowCustom(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Date:</span>
      <div className="inline-flex items-center rounded-lg p-0.5 border border-border bg-muted/30">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleQuick(opt.hours)}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
            showCustom
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Custom
        </button>
      </div>
      {isActive && (
        <button
          onClick={handleClear}
          className="text-xs text-primary hover:underline"
        >
          Clear
        </button>
      )}
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from?.split("T")[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                from: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              })
            }
            className="h-7 px-2 text-xs border border-border rounded-md bg-background"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={value.to?.split("T")[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                to: e.target.value
                  ? new Date(e.target.value + "T23:59:59").toISOString()
                  : null,
              })
            }
            className="h-7 px-2 text-xs border border-border rounded-md bg-background"
          />
        </div>
      )}
    </div>
  );
}
