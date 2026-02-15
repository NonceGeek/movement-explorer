"use client";

import { Fuel } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useGetGasPrice } from "@/hooks/common/useGetGasPrice";
import { cn } from "@/utils/styling";

export default function GasPriceIndicator() {
  const { data: gasPrice, isLoading, isError } = useGetGasPrice();

  if (isError || (!isLoading && !gasPrice)) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5",
              "rounded-lg border border-border/60 bg-background/40",
              "text-sm font-medium text-muted-foreground",
              "hover:bg-background/60 hover:text-foreground",
              "transition-all cursor-default select-none",
            )}
          >
            <Fuel className="h-3.5 w-3.5" />
            {isLoading ? (
              <div className="h-4 w-12 rounded bg-muted/60 animate-pulse" />
            ) : (
              <>
                <span className="text-foreground">
                  {gasPrice!.gas_estimate}
                </span>
                <span className="text-xs text-muted-foreground">Octas</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        {gasPrice && (
          <TooltipContent
            side="bottom"
            align="start"
            sideOffset={8}
            className="p-3"
          >
            <div className="space-y-2 text-xs">
              <p className="text-[11px] font-semibold text-white tracking-wide uppercase">
                Gas Price (per unit)
              </p>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-between gap-6">
                <p className="text-white/50">Low</p>
                <p className="font-mono text-white/90">
                  {gasPrice.deprioritized_gas_estimate} Octas
                </p>
              </div>
              <div className="flex items-center justify-between gap-6">
                <p className="text-white/50">Standard</p>
                <p className="font-mono text-white/90">
                  {gasPrice.gas_estimate} Octas
                </p>
              </div>
              <div className="flex items-center justify-between gap-6">
                <p className="text-white/50">Fast</p>
                <p className="font-mono text-white/90">
                  {gasPrice.prioritized_gas_estimate} Octas
                </p>
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
