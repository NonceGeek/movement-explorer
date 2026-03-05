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

const ACTIVITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "0x4::collection::MintEvent", label: "Mint" },
  { value: "0x1::object::TransferEvent", label: "Transfer" },
  { value: "0x4::collection::BurnEvent", label: "Burn" },
];

interface ActivityColumnFilterProps {
  value: string | null;
  onChange: (activityType: string | null) => void;
}

export function ActivityColumnFilter({
  value,
  onChange,
}: ActivityColumnFilterProps) {
  const isActive = value !== null;
  const activeLabel = ACTIVITY_OPTIONS.find((o) => o.value === value)?.label;

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
          {isActive ? `Activity: ${activeLabel}` : "Activity"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        <DropdownMenuRadioGroup
          value={value ?? "all"}
          onValueChange={(v) => onChange(v === "all" ? null : v)}
        >
          {ACTIVITY_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
