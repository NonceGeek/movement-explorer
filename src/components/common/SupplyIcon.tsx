"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, HelpCircle, BadgeCheck } from "lucide-react";
import { SupplyType } from "@/hooks/coins/useGetCoinSupplyLimit";

interface SupplyIconProps {
  supplyType?: SupplyType | null;
  hasSupply?: boolean;
}

export function SupplyIcon({ supplyType, hasSupply }: SupplyIconProps) {
  // Handle boolean hasSupply (for FA)
  if (hasSupply !== undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {hasSupply ? (
              <CheckCircle2 className="h-4 w-4 text-(--ms-good)" />
            ) : (
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {hasSupply
                ? "Supply tracked on-chain, may change over time"
                : "No supply is tracked for this asset"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Handle SupplyType enum (for Coin)
  switch (supplyType) {
    case SupplyType.ON_CHAIN:
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle2 className="h-4 w-4 text-(--ms-good)" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Supply tracked on-chain, may change over time</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case SupplyType.VERIFIED_OFF_CHAIN:
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <BadgeCheck className="h-4 w-4 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Supply verified off-chain to have a fixed supply</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case SupplyType.NO_SUPPLY_TRACKED:
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>No supply is tracked for this coin on-chain or off-chain</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    default:
      return null;
  }
}
