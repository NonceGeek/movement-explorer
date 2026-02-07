"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { StatsCard } from "@/components/common/StatsCard";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Server, Clock, Coins, HelpCircle } from "lucide-react";

interface ValidatorStatsCardsProps {
  numberOfActiveValidators: number | null;
  curEpoch: string | undefined;
  epochProgress: number;
  timeRemaining: string;
  totalStake: string;
  rewardsRateYearly: string | undefined;
  isLoading: boolean;
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* 1. Active Nodes */}
      <StatsCard
        icon={<Server className="h-5 w-5" />}
        label="Active Validator Nodes"
        value={numberOfActiveValidators ?? "-"}
        subValue="Securing the network"
        tooltip="Total number of active validators currently participating in consensus"
        loading={isLoading}
      />

      {/* 2. Epoch with Progress - custom card following StatsCard pattern */}
      <Card className="bg-card border-border hover:border-primary/50 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="focus:outline-none">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Current epoch number and progress until the next epoch
                    transition
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Current Epoch</p>
          <p className="text-2xl font-heading font-bold mb-2">
            {isLoading ? (
              <EnhancedSkeleton className="h-8 w-24" />
            ) : (
              curEpoch ? Number(curEpoch).toLocaleString("en-US") : "-"
            )}
          </p>
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
        </CardContent>
      </Card>

      {/* 3. Staking */}
      <StatsCard
        icon={<Coins className="h-5 w-5" />}
        label="Total MOVE Staked"
        value={`${totalStake} MOVE`}
        subValue={`${rewardsRateYearly ?? "-"}% APR Reward`}
        tooltip="Total amount of MOVE tokens staked across all validators"
        loading={isLoading}
      />
    </div>
  );
}
