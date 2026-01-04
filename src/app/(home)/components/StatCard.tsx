"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@movementlabsxyz/movement-design-system";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  tooltip?: string;
  isLoading?: boolean;
}

function formatNumber(num: number | string): string {
  return Number(num).toLocaleString();
}

export function StatCard({
  label,
  value,
  subLabel,
  tooltip,
  isLoading,
}: StatCardProps) {
  return (
    <Card
      variant="glow"
      className="p-5 h-[120px] flex flex-col justify-between group hover:border-guild-green-300/30 transition-all duration-300"
    >
      {/* Header: Label & Tooltip */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground font-medium tracking-wider">
          {label.toUpperCase()}
        </span>
        {tooltip && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  size={13}
                  className="text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors"
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-60 text-xs leading-relaxed"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Value & SubLabel */}
      <div className="flex-1 flex flex-col justify-center">
        {isLoading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <div className="text-[20px] font-semibold font-mono text-foreground leading-tight">
            {typeof value === "number" ? formatNumber(value) : value}
          </div>
        )}

        {/* Sub Label - always takes space for alignment */}
        <div className="text-[9px] text-muted-foreground/70 uppercase tracking-wider mt-1 h-3">
          {subLabel || "\u00A0"}
        </div>
      </div>
    </Card>
  );
}
