"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Hash,
  Key,
  Coins,
  Database,
  User,
  ArrowLeftRight,
  Image,
} from "lucide-react";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { Types } from "aptos";

export interface AccountOverviewProps {
  address: string;
  balance: string | undefined;
  balanceUSD: string | null;
  formattedBalance: string;
  accountData: Types.AccountData | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objectData?: any;
  movePrice?: number;
  coinCount: number;
  tokenCount: number;
  resourceCount: number;
  isLoading: boolean;
  onTabChange: (tab: string) => void;
}

export function AccountOverview({
  balanceUSD,
  formattedBalance,
  accountData,
  objectData,
  movePrice,
  coinCount,
  tokenCount,
  resourceCount,
  isLoading,
  onTabChange,
}: AccountOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {/* Card 1: Overview */}
      <div className="p-4 md:p-5 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <h3 className="text-xs text-muted-foreground font-medium tracking-wider mb-3">
          OVERVIEW
        </h3>
        <div className="space-y-3">
          {/* MOVE Balance */}
          <div>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
              <Wallet className="h-3.5 w-3.5" />
              MOVE Balance
            </span>
            {isLoading ? (
              <EnhancedSkeleton className="h-8 w-40" />
            ) : (
              <div className="text-2xl font-semibold font-mono tabular-nums">
                {formattedBalance} MOVE
              </div>
            )}
          </div>
          {/* USD Value */}
          <div>
            <span className="text-sm text-muted-foreground mb-1 block">
              MOVE Value
            </span>
            {isLoading ? (
              <EnhancedSkeleton className="h-6 w-28" />
            ) : (
              <div className="text-base text-muted-foreground tabular-nums">
                {balanceUSD ? balanceUSD : "$0.00"}
                {movePrice != null && (
                  <span className="text-sm text-muted-foreground/70">
                    {" "}
                    (@ ${movePrice.toFixed(4)}/MOVE)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Holdings */}
      <div className="p-4 md:p-5 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <h3 className="text-xs text-muted-foreground font-medium tracking-wider mb-3">
          HOLDINGS
        </h3>
        <div className="space-y-2.5">
          {/* Coins Count */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              Coins
            </span>
            {isLoading ? (
              <EnhancedSkeleton className="h-5 w-14" />
            ) : (
              <button
                onClick={() => onTabChange("coins")}
                className="text-base font-medium text-primary hover:underline tabular-nums cursor-pointer"
              >
                {coinCount}
              </button>
            )}
          </div>
          {/* NFT Count */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Image className="h-3.5 w-3.5" />
              NFTs
            </span>
            {isLoading ? (
              <EnhancedSkeleton className="h-5 w-14" />
            ) : (
              <button
                onClick={() => onTabChange("nfts")}
                className="text-base font-medium text-primary hover:underline tabular-nums cursor-pointer"
              >
                {tokenCount}
              </button>
            )}
          </div>
          {/* Resources Count */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              Resources
            </span>
            {isLoading ? (
              <EnhancedSkeleton className="h-5 w-14" />
            ) : (
              <button
                onClick={() => onTabChange("resources")}
                className="text-base font-medium text-primary hover:underline tabular-nums cursor-pointer"
              >
                {resourceCount}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card 3: More Info */}
      <div className="p-4 md:p-5 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <h3 className="text-xs text-muted-foreground font-medium tracking-wider mb-3">
          MORE INFO
        </h3>
        <div className="space-y-2.5">
          {/* Sequence Number */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              Txns Sent
            </span>
            {isLoading ? (
              <EnhancedSkeleton className="h-5 w-14" />
            ) : (
              <span className="text-sm font-medium font-mono tabular-nums">
                {accountData?.sequence_number
                  ? Number(accountData.sequence_number).toLocaleString()
                  : "0"}
              </span>
            )}
          </div>
          {/* Authentication Key */}
          {accountData?.authentication_key && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                <Key className="h-3.5 w-3.5" />
                Auth Key
              </span>
              <div className="min-w-0">
                <CopyableAddress
                  address={accountData.authentication_key}
                  showCopyButton
                  className="text-sm"
                  copyTooltip="Copy auth key"
                />
              </div>
            </div>
          )}
          {/* Object Owner */}
          {objectData?.data?.owner && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                <User className="h-3.5 w-3.5" />
                Owner
              </span>
              <div className="min-w-0">
                <CopyableAddress
                  address={objectData.data.owner}
                  showCopyButton
                  className="text-sm"
                />
              </div>
            </div>
          )}
          {/* Object Transferrable */}
          {objectData && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Transferrable
              </span>
              <span className="text-sm font-medium">
                {objectData.data?.allow_ungated_transfer ? "Yes" : "No"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
