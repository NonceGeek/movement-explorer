"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MetricCardProps = {
  data: string;
  label: string;
  tooltip: React.ReactNode;
};

export default function MetricCard({ data, label, tooltip }: MetricCardProps) {
  return (
    <Card className="border border-border/50 bg-card/50 h-[120px]">
      <CardContent className="p-4 flex flex-col gap-3">
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
        <div className="text-xl font-medium">{data}</div>
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
};

export function DoubleMetricCard({
  data1,
  data2,
  label1,
  label2,
  cardLabel,
  tooltip,
}: DoubleMetricCardProps) {
  return (
    <Card className="border border-border/50 bg-card/50 h-[120px]">
      <CardContent className="p-4 flex flex-col gap-3">
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
            <div className="text-xl font-medium">{data1}</div>
            <div className="text-[10px] text-muted-foreground">{label1}</div>
          </div>
          {data2 && (
            <div className="w-1/2">
              <div className="text-xl font-medium">{data2}</div>
              <div className="text-[10px] text-muted-foreground">{label2}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
