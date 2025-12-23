"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STAKING_URL = "https://staking.movementnetwork.xyz";

export function StakingPromo() {
  const handleClick = () => {
    window.open(STAKING_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-gradient-to-r from-muted/50 to-muted rounded-lg p-4 md:p-6 mb-6 border border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-semibold">
            STAKE
          </span>
          <p className="text-sm md:text-base text-foreground">
            Delegate your MOVE tokens to help secure the Movement Network and
            Earn Rewards
          </p>
        </div>
        <Button onClick={handleClick} className="shrink-0">
          Stake Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
