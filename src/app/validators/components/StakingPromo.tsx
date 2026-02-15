"use client";

import { ArrowRight, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAKING_URL } from "@/constants";

export function StakingPromo() {
  const handleClick = () => {
    window.open(STAKING_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Coins className="h-4 w-4 text-primary shrink-0" />
        <span>
          Delegate your MOVE tokens to help secure the Movement Network and
          earn rewards.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="shrink-0 text-xs ml-4"
      >
        Stake Now
        <ArrowRight className="ml-1.5 h-3 w-3" />
      </Button>
    </div>
  );
}
