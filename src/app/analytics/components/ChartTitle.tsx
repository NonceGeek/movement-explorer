"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ChartTitleProps = {
  label: string;
  tooltip: React.ReactNode;
};

export default function ChartTitle({ label, tooltip }: ChartTitleProps) {
  return (
    <div className="flex items-center justify-between w-full mb-3">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
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
  );
}
