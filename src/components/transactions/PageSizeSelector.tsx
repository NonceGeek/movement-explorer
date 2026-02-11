"use client";

import { cn } from "@/utils/styling";
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
} from "@/store/useTransactionPaginationStore";

export interface PageSizeSelectorProps {
  value: PageSize;
  onChange: (size: PageSize) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Etherscan-style page size selector
 * Show: [10] [25] [50] [100] Records
 */
export function PageSizeSelector({
  value,
  onChange,
  className,
  disabled = false,
}: PageSizeSelectorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="text-muted-foreground">Show:</span>
      <div className="flex items-center gap-1">
        {PAGE_SIZE_OPTIONS.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            disabled={disabled}
            className={cn(
              "h-8 min-w-[36px] px-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
              "border border-transparent",
              "hover:bg-muted hover:text-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              value === size
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            {size}
          </button>
        ))}
      </div>
      <span className="text-muted-foreground">Records</span>
    </div>
  );
}
