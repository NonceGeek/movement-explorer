"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock } from "lucide-react";

interface TimeDurationIntervalBarProps {
  timestamp?: number; // Unix timestamp in seconds
}

function formatCountdown(milliseconds: number): string {
  if (milliseconds <= 0) return "Unlocked";

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const d = days;
  const h = hours % 24;
  const m = minutes % 60;
  const s = seconds % 60;

  if (d >= 10) {
    return `${d}d ${h}h ${m}m`;
  }
  if (d > 0) {
    return `${d}d ${h}h ${m}m ${s}s`;
  }
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

export function TimeDurationIntervalBar({
  timestamp,
}: TimeDurationIntervalBarProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timestamp) {
    return <span className="text-muted-foreground">-</span>;
  }

  const unlockTime = timestamp * 1000; // Convert to milliseconds
  // Assuming 14 days lockup period for mainnet
  const startTime = unlockTime - 14 * 24 * 60 * 60 * 1000;
  const totalDuration = unlockTime - startTime;
  const elapsed = now - startTime;
  const remaining = unlockTime - now;

  const percentage = Math.min(
    Math.max((elapsed / totalDuration) * 100, 0),
    100,
  );
  const isUnlocked = remaining <= 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 flex-1">
          <Progress
            value={percentage}
            className="h-4 flex-1 bg-indigo-500/30"
          />
          <div className="flex items-center gap-1 text-xs font-medium min-w-20 justify-end">
            {!isUnlocked && <Clock className="h-3 w-3 text-muted-foreground" />}
            <span className={isUnlocked ? "text-green-500" : ""}>
              {formatCountdown(remaining)}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {isUnlocked
            ? "Tokens are unlocked and can be withdrawn"
            : `Unlocks on ${new Date(unlockTime).toLocaleString()}`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
