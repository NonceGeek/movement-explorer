"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

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
    <div className="p-4 sm:p-5 h-[100px] sm:h-[120px] flex flex-col justify-between">
      {/* Header: Label & Tooltip */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium tracking-wider">
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
          <div className="text-[16px] sm:text-[20px] font-semibold font-mono text-foreground leading-tight">
            {typeof value === "number" ? formatNumber(value) : value}
          </div>
        )}

        {/* Sub Label - always takes space for alignment */}
        <div className="text-[9px] text-muted-foreground/70 uppercase tracking-wider mt-1 h-3">
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 [&>*:not(:last-child)]:border-r [&>*]:border-border/30 [&>*:nth-child(2)]:max-sm:border-r-0 [&>*:nth-child(3)]:max-lg:border-r-0 [&>*:nth-child(n+3)]:max-sm:border-t [&>*:nth-child(n+4)]:sm:max-lg:border-t">
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
