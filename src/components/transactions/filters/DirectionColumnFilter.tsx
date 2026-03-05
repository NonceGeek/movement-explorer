"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";
import { TransactionDirection } from "@/utils/transaction";

export type DirectionFilterValue = "any" | TransactionDirection;

const DIRECTION_OPTIONS: { value: DirectionFilterValue; label: string }[] = [
  { value: "any", label: "ANY" },
  { value: "out", label: "OUT" },
  { value: "in", label: "IN" },
  { value: "self", label: "SELF" },
  { value: "call", label: "CALL" },
  { value: "related", label: "RELATED" },
];

interface DirectionColumnFilterProps {
  value: DirectionFilterValue;
  onChange: (value: DirectionFilterValue) => void;
}

export function DirectionColumnFilter({
  value,
  onChange,
}: DirectionColumnFilterProps) {
  const isActive = value !== "any";

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
          {isActive ? `DIR: ${value.toUpperCase()}` : "DIR"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v as DirectionFilterValue)}
        >
          {DIRECTION_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
