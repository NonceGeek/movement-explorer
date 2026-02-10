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

export interface StatItemProps {
  label: string;
  value: string | number;
  subLabel?: string;
  tooltip?: string;
  isLoading?: boolean;
}

function formatNumber(num: number | string): string {
  return Number(num).toLocaleString();
}

/**
 * StatItem - 无边框的统计项，用于放在 StatsGrid 容器内
 */
export function StatItem({
  label,
  value,
  subLabel,
  tooltip,
  isLoading,
}: StatItemProps) {
  return (
    <div className="p-4 md:p-5 h-[100px] sm:h-[120px] flex flex-col justify-between">
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

      {/* Value & SubLabel */}
      <div className="flex-1 flex flex-col justify-center">
        {isLoading ? (
          <EnhancedSkeleton className="h-6 w-20" />
        ) : (
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground leading-tight break-all">
            {typeof value === "number" ? (
              <RollingNumber value={value} />
            ) : (
              value
            )}
          </div>
        )}

        {/* Sub Label - always takes space for alignment */}
        <div className="text-xs text-muted-foreground/70 uppercase tracking-wider mt-1 h-4">
          {subLabel || "\u00A0"}
        </div>
      </div>
    </div>
  );
}

interface StatsRowProps {
  children: React.ReactNode;
}

/**
 * StatsRow - 横向排列的统计容器
 * 设计为 1 行 N 列网格布局，用分隔线隔开
 * 响应式：移动端 2 列，平板 3 列，桌面 5 列
 */
export function StatsRow({ children }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 [&>*]:border-border/30 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1 [&>*:nth-child(even)]:border-r [&>*:nth-child(odd)]:border-r-0 sm:[&>*:nth-child(odd)]:border-r sm:[&>*:nth-child(3n)]:border-r-0 lg:[&>*:nth-child(3n)]:border-r lg:[&>*:nth-child(5n)]:border-r-0 [&>*:nth-last-child(n+3)]:border-b sm:[&>*:nth-last-child(n+3)]:border-b-0 sm:[&>*:nth-last-child(n+4)]:border-b lg:[&>*]:border-b-0 lg:[&>*:nth-child(5n)]:border-r-0">
      {children}
    </div>
  );
}

// 保留旧的 StatCard 组件用于向后兼容（独立卡片场景）
export function StatCard(props: StatItemProps) {
  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
      <StatItem {...props} />
    </div>
  );
}
