"use client";

import { ArrowUpDown, ArrowUp, ArrowDown, Info } from "lucide-react";
import { StyledTableHead } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/styling";

export type SortDirection = "asc" | "desc";

interface SortableHeaderProps<T extends string> {
  label: string;
  column: T;
  currentColumn: T | null;
  currentDirection: SortDirection;
  onSort: (column: T) => void;
  className?: string;
  tooltip?: string;
}

export function SortableHeader<T extends string>({
  label,
  column,
  currentColumn,
  currentDirection,
  onSort,
  className,
  tooltip,
}: SortableHeaderProps<T>) {
  const isActive = currentColumn === column;

  return (
    <StyledTableHead className={className}>
      <button
        className={cn(
          "flex items-center gap-1 transition-colors cursor-pointer",
          isActive
            ? "text-foreground"
            : "hover:text-foreground",
        )}
        onClick={() => onSort(column)}
      >
        {label}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/60" />
              </TooltipTrigger>
              <TooltipContent className="max-w-64 text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isActive ? (
          currentDirection === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUp className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
    </StyledTableHead>
  );
}
