"use client";

import Link from "next/link";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { RollingNumber } from "@/components/ui/rolling-number";
import TrendIndicator from "@/app/analytics/components/TrendIndicator";
import { formatCompactNumber } from "@/utils/formatting";
import { cn } from "@/utils/styling";

interface MetricCardProps {
  label: string;
  value: string | number;
  tooltip?: string;
  isLoading?: boolean;
  trend?: React.ReactNode; // Trend indicator (e.g., TrendIndicator component)
  isHighlight?: boolean; // Whether to highlight the card
  href?: string; // Click to navigate
}

/**
 * MetricCard - Individual metric card for core stats
 */
function MetricCard({
  label,
  value,
  tooltip,
  isLoading,
  trend,
  isHighlight,
  href,
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "p-4 h-[110px] flex flex-col justify-between",
        "bg-card backdrop-blur-sm rounded-xl border border-border/50",
        "transition-all duration-300",
        // Clickable card hover effects
        href && [
          "hover:bg-card",
          "hover:border-primary/40",
          "hover:shadow-lg hover:shadow-primary/10",
          "hover:-translate-y-0.5",
          "cursor-pointer",
        ],
        // Highlight style
        isHighlight && "border-primary/50 bg-primary/5"
      )}
    >
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

      {/* Value & Trend */}
      <div className="flex-1 flex items-center">
        {isLoading ? (
          <EnhancedSkeleton className="h-7 w-24" />
        ) : trend ? (
          /* With trend: wrapper with baseline alignment for value + trend */
          <div className="flex items-baseline gap-2 flex-wrap">
            <div
              className={cn(
                "text-xl sm:text-2xl font-bold font-mono tabular-nums leading-tight",
                isHighlight ? "text-primary" : "text-foreground"
              )}
            >
              {typeof value === "number" ? (
                <RollingNumber value={value} />
              ) : (
                value
              )}
            </div>
            {trend}
          </div>
        ) : (
          /* Without trend: just the value */
          <div
            className={cn(
              "text-xl sm:text-2xl font-bold font-mono tabular-nums leading-tight",
              isHighlight ? "text-primary" : "text-foreground"
            )}
          >
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

  // Wrap with Link if href is provided
  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

interface CoreMetricsGridProps {
  movePrice?: number;
  priceChange24h?: number; // 24-hour price change percentage
  marketCap?: number;
  totalTransactions: number;
  totalAccounts: number;
  peakTps?: number;
  avgGasPrice?: number;
  isLoading?: boolean;
}

/**
 * CoreMetricsGrid - Grid of 6 core metrics
 * Layout: 3 columns x 2 rows on desktop, 2 columns on tablet/mobile
 */
export function CoreMetricsGrid({
  movePrice,
  priceChange24h,
  marketCap,
  totalTransactions,
  totalAccounts,
  peakTps,
  avgGasPrice,
  isLoading,
}: CoreMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Row 1 */}
      <MetricCard
        label="MOVE Price"
        value={movePrice ? `$${movePrice.toFixed(4)}` : "-"}
        tooltip="Current price of MOVE token."
        trend={
          priceChange24h !== undefined &&
          priceChange24h !== null && <TrendIndicator value={priceChange24h} />
        }
        href="/analytics"
        isLoading={isLoading}
      />
      <MetricCard
        label="Market Cap"
        value={marketCap ? `$${formatCompactNumber(marketCap)}` : "-"}
        tooltip="Total market capitalization of MOVE token."
        href="/analytics"
        isLoading={isLoading}
      />
      <MetricCard
        label="Total Transactions"
        value={totalTransactions}
        tooltip="Total number of transactions on the Movement network since genesis."
        href="/analytics"
        isLoading={isLoading}
      />

      {/* Row 2 */}
      <MetricCard
        label="Total Accounts"
        value={totalAccounts}
        tooltip="Total number of accounts created on the Movement network."
        href="/analytics"
        isLoading={isLoading}
      />
      <MetricCard
        label="Peak TPS"
        value={peakTps ? formatCompactNumber(Math.round(peakTps), 0) : "-"}
        tooltip="The highest count of user transactions within any two-block interval in the past 30 days."
        href="/analytics#section-network-activity"
        isLoading={isLoading}
      />
      <MetricCard
        label="Avg Gas Price"
        value={avgGasPrice ? parseFloat(avgGasPrice.toFixed(2)) : "-"}
        tooltip="Average gas unit price for user transactions on the latest day."
        href="/analytics#section-gas-fees"
        isLoading={isLoading}
      />
    </div>
  );
}
