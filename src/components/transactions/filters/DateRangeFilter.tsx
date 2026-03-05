"use client";

import { useState } from "react";
import { CalendarIcon, Funnel } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { TimestampModeToggle } from "@/components/common/TimestampModeToggle";
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

interface DateRangeColumnFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode: (mode: "age" | "dateTime") => void;
}

/**
 * Column-level filter for the Age/Timestamp column header.
 * Renders the TimestampModeToggle alongside a date range filter dropdown.
 */
export function DateRangeColumnFilter({
  dateRange,
  onDateRangeChange,
  timestampMode,
  onToggleTimestampMode,
}: DateRangeColumnFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const isActive = dateRange.from !== null || dateRange.to !== null;

  const fromDate = dateRange.from ? new Date(dateRange.from) : undefined;
  const toDate = dateRange.to ? new Date(dateRange.to) : undefined;

  const getActiveLabel = () => {
    if (!isActive) return null;
    const from = dateRange.from ? new Date(dateRange.from) : null;
    const to = dateRange.to ? new Date(dateRange.to) : null;
    if (from && to) {
      const diffHours = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
      for (const opt of QUICK_OPTIONS) {
        if (Math.abs(diffHours - opt.hours) < 1) return opt.label;
      }
    }
    return "Custom";
  };

  const handleQuick = (hours: number) => {
    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    onDateRangeChange({ from: from.toISOString(), to: now.toISOString() });
    setShowCustom(false);
  };

  const handleClear = () => {
    onDateRangeChange({ from: null, to: null });
    setShowCustom(false);
  };

  const handleFromSelect = (day: Date | undefined) => {
    onDateRangeChange({
      ...dateRange,
      from: day ? startOfDay(day).toISOString() : null,
    });
    setFromOpen(false);
  };

  const handleToSelect = (day: Date | undefined) => {
    onDateRangeChange({
      ...dateRange,
      to: day ? endOfDay(day).toISOString() : null,
    });
    setToOpen(false);
  };

  const activeLabel = getActiveLabel();

  return (
    <div className="flex items-center gap-1.5">
      <TimestampModeToggle
        mode={timestampMode}
        setMode={onToggleTimestampMode}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium cursor-pointer transition-colors rounded px-1 py-0.5",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {activeLabel ?? ""}
            <span className="relative">
              <Funnel className="h-3.5 w-3.5" />
              {isActive && (
                <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-80 p-3 rounded-2xl"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleQuick(opt.hours)}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer",
                    activeLabel === opt.label && !showCustom
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={cn(
                  "flex-1 py-1.5 px-2 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer",
                  showCustom || activeLabel === "Custom"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                )}
              >
                Custom
              </button>
            </div>
            {showCustom && (
              <>
                <div className="border-t border-border" />
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground ml-1">
                      Start date
                    </label>
                    <Popover open={fromOpen} onOpenChange={setFromOpen}>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "w-full h-8 px-3 inline-flex items-center gap-2 text-xs rounded-full border border-border bg-background transition-colors hover:border-foreground/30 cursor-pointer",
                            fromDate
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                          {fromDate
                            ? format(fromDate, "MMM d, yyyy")
                            : "Pick a date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-background border border-border shadow-lg"
                        align="start"
                        side="bottom"
                      >
                        <Calendar
                          mode="single"
                          selected={fromDate}
                          onSelect={handleFromSelect}
                          disabled={{ after: toDate ?? new Date() }}
                          defaultMonth={fromDate ?? new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground ml-1">
                      End date
                    </label>
                    <Popover open={toOpen} onOpenChange={setToOpen}>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "w-full h-8 px-3 inline-flex items-center gap-2 text-xs rounded-full border border-border bg-background transition-colors hover:border-foreground/30 cursor-pointer",
                            toDate
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                          {toDate
                            ? format(toDate, "MMM d, yyyy")
                            : "Pick a date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-background border border-border shadow-lg"
                        align="start"
                        side="bottom"
                      >
                        <Calendar
                          mode="single"
                          selected={toDate}
                          onSelect={handleToSelect}
                          disabled={{
                            before: fromDate,
                            after: new Date(),
                          }}
                          defaultMonth={toDate ?? fromDate ?? new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </>
            )}
            {isActive && (
              <>
                <div className="border-t border-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="w-full text-muted-foreground"
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
