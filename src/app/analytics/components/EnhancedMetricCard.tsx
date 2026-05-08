"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TrendIndicator from "./TrendIndicator";
import { cn } from "@/utils/styling";

type EnhancedMetricCardProps = {
  data: string;
  label: string;
  tooltip: React.ReactNode;
  icon?: React.ReactNode;
  trend?: number; // Optional trend percentage (e.g., 2.5 for 2.5%)
  size?: "md" | "lg";
};

/**
 * EnhancedMetricCard - Enhanced metric card for unified stats grid
 * Features:
 * - Larger sizing options (md: 120px, lg: 140px)
 * - Larger value text (text-3xl for prominent display)
 * - Optional icon support in top-left
 * - Etherscan-style borders and hover effects
 * - Trend indicators
 */
export default function EnhancedMetricCard({
  data,
  label,
  tooltip,
  icon,
  trend,
  size = "lg",
}: EnhancedMetricCardProps) {
  const height = size === "lg" ? "h-[140px]" : "h-[120px]";
  const valueSize = size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <Card
      className={cn(
        "border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300",
        height
      )}
    >
      <CardContent className="flex justify-center flex-col gap-3 h-full">
        {/* Icon (if provided) - top left */}
        {icon && (
          <div className="flex items-center justify-start gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
            {/* Value with Trend Indicator */}
            <div className="flex items-baseline gap-2 mt-auto">
              <div className={cn("font-bold", valueSize)}>{data}</div>
              {trend !== undefined && <TrendIndicator value={trend} />}
            </div>
          </div>
        )}

        {/* Label with Tooltip */}
        <div className="flex items-center gap-2">

          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </span>


          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>


      </CardContent>
    </Card>
  );
}
