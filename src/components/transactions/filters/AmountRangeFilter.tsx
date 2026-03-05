"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";

export interface AmountRange {
  min: string;
  max: string;
}

interface AmountRangeFilterProps {
  value: AmountRange;
  onChange: (range: AmountRange) => void;
}

export function AmountRangeFilter({ value, onChange }: AmountRangeFilterProps) {
  const isActive = value.min !== "" || value.max !== "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
            isActive
              ? "text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {isActive ? "Amount (filtered)" : "Amount"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 p-3"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Min (MOVE)</label>
            <input
              type="number"
              step="any"
              placeholder="0"
              value={value.min}
              onChange={(e) => onChange({ ...value, min: e.target.value })}
              className="w-full h-7 px-2 text-xs border border-border rounded-md bg-background mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Max (MOVE)</label>
            <input
              type="number"
              step="any"
              placeholder="No limit"
              value={value.max}
              onChange={(e) => onChange({ ...value, max: e.target.value })}
              className="w-full h-7 px-2 text-xs border border-border rounded-md bg-background mt-1"
            />
          </div>
          {isActive && (
            <button
              onClick={() => onChange({ min: "", max: "" })}
              className="w-full text-xs text-primary hover:underline pt-1"
            >
              Clear
            </button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
