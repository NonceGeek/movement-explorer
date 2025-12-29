"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const STAKING_URL = "https://staking.movementnetwork.xyz";

export function StakingPromo() {
  const handleClick = () => {
    window.open(STAKING_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="bg-linear-to-r from-muted/50 to-muted mb-6">
      <div className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge>STAKE</Badge>
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
    </Card>
  );
}
