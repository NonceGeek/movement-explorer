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

type MetricCardProps = {
  data: string;
  label: string;
  tooltip: React.ReactNode;
  trend?: number; // Optional trend percentage (e.g., 2.5 for 2.5%)
};

/**
 * MetricCard - Enhanced with Etherscan-style borders and trend indicators
 */
export default function MetricCard({
  data,
  label,
  tooltip,
  trend,
}: MetricCardProps) {
  return (
    <Card className="border border-border/30 bg-card/50 h-[120px] shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {label}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-xl font-medium">{data}</div>
          {trend !== undefined && <TrendIndicator value={trend} />}
        </div>
      </CardContent>
    </Card>
  );
}

type DoubleMetricCardProps = {
  data1: string;
  data2?: string;
  label1: string;
  label2?: string;
  cardLabel: string;
  tooltip: React.ReactNode;
  trend1?: number; // Optional trend for first metric
  trend2?: number; // Optional trend for second metric
};

/**
 * DoubleMetricCard - Enhanced with Etherscan-style borders and trend indicators
 */
export function DoubleMetricCard({
  data1,
  data2,
  label1,
  label2,
  cardLabel,
  tooltip,
  trend1,
  trend2,
}: DoubleMetricCardProps) {
  return (
    <Card className="border border-border/30 bg-card/50 h-[120px] shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {cardLabel}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <div className="text-xs">{tooltip}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex w-full">
          <div className={data2 ? "w-1/2" : "w-full"}>
            <div className="flex items-baseline gap-2">
              <div className="text-xl font-medium">{data1}</div>
              {trend1 !== undefined && <TrendIndicator value={trend1} />}
            </div>
            <div className="text-xs text-muted-foreground">{label1}</div>
          </div>
          {data2 && (
            <div className="w-1/2">
              <div className="flex items-baseline gap-2">
                <div className="text-xl font-medium">{data2}</div>
                {trend2 !== undefined && <TrendIndicator value={trend2} />}
              </div>
              <div className="text-xs text-muted-foreground">{label2}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
