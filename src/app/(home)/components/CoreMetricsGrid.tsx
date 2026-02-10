"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { RollingNumber } from "@/components/ui/rolling-number";

interface MetricCardProps {
  label: string;
  value: string | number;
  tooltip?: string;
  isLoading?: boolean;
}

function formatNumber(num: number | string): string {
  return Number(num).toLocaleString();
}

/**
 * MetricCard - Individual metric card for core stats
 */
function MetricCard({ label, value, tooltip, isLoading }: MetricCardProps) {
  return (
    <div className="p-4 h-[110px] flex flex-col justify-between bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
      {/* Header: Label & Tooltip */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium tracking-wider">
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

      {/* Value */}
      <div className="flex-1 flex items-center">
        {isLoading ? (
          <EnhancedSkeleton className="h-7 w-24" />
        ) : (
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground leading-tight">
            {typeof value === "number" ? (
              <RollingNumber value={value} />
            ) : (
              value
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CoreMetricsGridProps {
  movePrice?: number;
  marketCap?: number;
  totalTransactions: number;
  totalAccounts: number;
  peakTps?: number;
  avgGasPrice?: number;
  isLoading?: boolean;
}

/**
 * CoreMetricsGrid - Grid of 6 core metrics
 * Layout: 3 columns x 2 rows on desktop, 2 columns on tablet, 1 column on mobile
 */
export function CoreMetricsGrid({
  movePrice,
  marketCap,
  totalTransactions,
  totalAccounts,
  peakTps,
  avgGasPrice,
  isLoading,
}: CoreMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Row 1 */}
      <MetricCard
        label="MOVE Price"
        value={movePrice ? `$${movePrice.toFixed(4)}` : "-"}
        tooltip="Current price of MOVE token."
        isLoading={isLoading}
      />
      <MetricCard
        label="Market Cap"
        value={marketCap ? `$${formatNumber(marketCap)}` : "-"}
        tooltip="Total market capitalization of MOVE token."
        isLoading={isLoading}
      />
      <MetricCard
        label="Total Transactions"
        value={totalTransactions}
        tooltip="Total number of transactions on the Movement network since genesis."
        isLoading={isLoading}
      />

      {/* Row 2 */}
      <MetricCard
        label="Total Accounts"
        value={totalAccounts}
        tooltip="Total number of accounts created on the Movement network."
        isLoading={isLoading}
      />
      <MetricCard
        label="Peak TPS"
        value={peakTps ? formatNumber(Math.round(peakTps)) : "-"}
        tooltip="The highest count of user transactions within any two-block interval in the past 30 days, divided by the duration of that interval."
        isLoading={isLoading}
      />
      <MetricCard
        label="Avg Gas Price"
        value={avgGasPrice ? parseFloat(avgGasPrice.toFixed(2)) : "-"}
        tooltip="Average gas unit price for user transactions on the latest day."
        isLoading={isLoading}
      />
    </div>
  );
}
