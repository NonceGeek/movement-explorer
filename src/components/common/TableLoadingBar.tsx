"use client";

import { cn } from "@/utils/styling";

interface TableLoadingBarProps {
  visible: boolean;
  className?: string;
}

/**
 * Thin indeterminate progress bar for table loading state.
 * Position with `relative` on the parent container.
 */
export function TableLoadingBar({ visible, className }: TableLoadingBarProps) {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 z-10 h-0.5 overflow-hidden transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <div className="h-full w-1/3 bg-primary rounded-full animate-indeterminate-progress" />
    </div>
  );
}
