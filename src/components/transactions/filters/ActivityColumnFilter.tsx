"use client";

import { Funnel } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
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
  const currentValue = value ?? "all";

  return (
    <DropdownMenu modal={false}>
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
        className="w-auto p-3 rounded-2xl"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-1.5">
          {ACTIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value === "all" ? null : opt.value)}
              className={cn(
                "py-1.5 px-3 text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer",
                currentValue === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
