"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  Copy,
  ChevronRight,
  Wallet,
  Hash,
  Key,
  Coins,
  Database,
} from "lucide-react";
import { Types } from "aptos";
import { cn } from "@/utils/styling";

export interface AccountOverviewProps {
  address: string;
  balance: string | undefined;
  balanceUSD: string | null;
  formattedBalance: string;
  accountData: Types.AccountData | undefined;
  tokenCount: number;
  resourceCount: number;
  isLoading: boolean;
  onTabChange: (tab: string) => void;
}

export function AccountOverview({
  address,
  balance,
  balanceUSD,
  formattedBalance,
  accountData,
  tokenCount,
  resourceCount,
  isLoading,
  onTabChange,
}: AccountOverviewProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyAuthKey = async () => {
    if (accountData?.authentication_key) {
      await navigator.clipboard.writeText(accountData.authentication_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const truncateKey = (key: string) => {
    if (key.length <= 20) return key;
    return `${key.slice(0, 10)}...${key.slice(-8)}`;
  };

  return (
    <Card className="bg-card border-border mb-8 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40">
        {/* Column 1: Overview */}
        <div className="px-5 py-4 space-y-3">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            Overview
          </h3>
          <div className="space-y-2.5">
            {/* MOVE Balance */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wallet className="h-3 w-3" />
                Balance
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-5 w-24" />
              ) : (
                <span className="text-sm font-semibold tabular-nums">
                  {formattedBalance} MOVE
                </span>
              )}
            </div>
            {/* USD Value */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Value</span>
              {isLoading ? (
                <EnhancedSkeleton className="h-4 w-16" />
              ) : (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {balanceUSD ? balanceUSD : "$0.00"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: More Info */}
        <div className="px-5 py-4 space-y-3">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            More Info
          </h3>
          <div className="space-y-2.5">
            {/* Sequence Number */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                Txns Sent
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-4 w-12" />
              ) : (
                <span className="text-sm font-medium tabular-nums">
                  {accountData?.sequence_number
                    ? Number(accountData.sequence_number).toLocaleString()
                    : "0"}
                </span>
              )}
            </div>
            {/* Authentication Key */}
            {accountData?.authentication_key && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Key className="h-3 w-3" />
                  Auth Key
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  <code className="text-xs font-mono text-muted-foreground truncate">
                    {truncateKey(accountData.authentication_key)}
                  </code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 shrink-0"
                          onClick={handleCopyAuthKey}
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{copiedKey ? "Copied!" : "Copy"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Token Holdings */}
        <div className="px-5 py-4 space-y-3">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            Token Holdings
          </h3>
          <div className="space-y-2.5">
            {/* Token Count */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="h-3 w-3" />
                Tokens
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-4 w-14" />
              ) : (
                <button
                  onClick={() => onTabChange("tokens")}
                  className="text-sm font-medium text-primary hover:underline tabular-nums cursor-pointer"
                >
                  {tokenCount}
                </button>
              )}
            </div>
            {/* Resources Count */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                Resources
              </span>
              <button
                onClick={() => onTabChange("resources")}
                className="text-sm font-medium text-primary hover:underline tabular-nums cursor-pointer"
              >
                {resourceCount}
              </button>
            </div>
            {/* Quick Link */}
            <button
              onClick={() => onTabChange("coins")}
              className="flex items-center gap-1 text-xs text-primary hover:underline transition-colors cursor-pointer pt-0.5"
            >
              View Coins
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
