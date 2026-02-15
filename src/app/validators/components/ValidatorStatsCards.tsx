"use client";

import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

interface ValidatorStatsCardsProps {
  numberOfActiveValidators: number | null;
  curEpoch: string | undefined;
  epochProgress: number;
  timeRemaining: string;
  totalStake: string;
  rewardsRateYearly: string | undefined;
  isLoading: boolean;
}

function StatTooltip({ text }: { text: string }) {
  return (
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
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ValidatorStatsCards({
  numberOfActiveValidators,
  curEpoch,
  epochProgress,
  timeRemaining,
  totalStake,
  rewardsRateYearly,
  isLoading,
}: ValidatorStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
      {/* 1. Active Nodes */}
      <div className="p-4 h-[110px] flex flex-col justify-between bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium tracking-wider">
            ACTIVE VALIDATOR NODES
          </span>
          <StatTooltip text="Total number of active validators currently participating in consensus" />
        </div>
        <div className="flex-1 flex items-center">
          {isLoading ? (
            <EnhancedSkeleton className="h-7 w-24" />
          ) : (
            <span className="text-2xl font-bold font-mono tabular-nums leading-tight text-foreground">
              {numberOfActiveValidators ?? "-"}
            </span>
          )}
        </div>
      </div>

      {/* 2. Current Epoch with Progress */}
      <div className="p-4 h-[110px] flex flex-col justify-between bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium tracking-wider">
            CURRENT EPOCH
          </span>
          <StatTooltip text="Current epoch number and progress until the next epoch transition" />
        </div>
        <div className="flex-1 flex items-center">
          {isLoading ? (
            <EnhancedSkeleton className="h-7 w-24" />
          ) : (
            <span className="text-2xl font-bold font-mono tabular-nums leading-tight text-foreground">
              {curEpoch ? Number(curEpoch).toLocaleString("en-US") : "-"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <EnhancedSkeleton className="h-1.5 flex-1" />
          ) : (
            <Progress value={epochProgress} className="h-1.5 flex-1" />
          )}
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {isLoading ? (
              <EnhancedSkeleton className="h-3 w-16" />
            ) : (
              timeRemaining || "calculating..."
            )}
          </span>
        </div>
      </div>

      {/* 3. Total MOVE Staked */}
      <div className="p-4 h-[110px] flex flex-col justify-between bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium tracking-wider">
            TOTAL MOVE STAKED
          </span>
          <StatTooltip text="Total amount of MOVE tokens staked across all validators" />
        </div>
        <div className="flex-1 flex items-center">
          {isLoading ? (
            <EnhancedSkeleton className="h-7 w-24" />
          ) : (
            <span className="text-2xl font-bold font-mono tabular-nums leading-tight text-foreground">
              {totalStake} MOVE
            </span>
          )}
        </div>
        {rewardsRateYearly && (
          <span className="text-xs text-muted-foreground">
            {rewardsRateYearly}% APR Reward
          </span>
        )}
      </div>
    </div>
  );
}
