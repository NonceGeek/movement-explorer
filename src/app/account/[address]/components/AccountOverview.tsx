"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { Types } from "aptos";
import { cn } from "@/utils/styling";
import { formatAge, formatDateTimeUTC } from "@/utils/time";
import { formatTokenAmount } from "@/utils/formatters";
import { ExternalLink, Info } from "lucide-react";
import type { AccountTimeline } from "@/hooks/accounts/useGetAccountFirstLastTx";
import type { AccountMoveFlow } from "@/hooks/accounts/useGetAccountMoveFlow";
import { AccountTokenHoldingsDropdown } from "./AccountTokenHoldingsDropdown";

const CARD_CLASS =
  "p-4 md:p-5 bg-card backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5";

const TITLE_CLASS =
  "text-sm text-muted-foreground font-medium tracking-wider mb-4";

const LABEL_CLASS = "text-sm text-muted-foreground tracking-wide";

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
  timeline: AccountTimeline | null | undefined;
  timelineLoading: boolean;
  moveFlow: AccountMoveFlow | null | undefined;
  moveFlowLoading: boolean;
  accountType: "account" | "object" | "token";
}

export function AccountOverview({
  address,
  balanceUSD,
  formattedBalance,
  accountData,
  objectData,
  movePrice,
  isLoading,
  onTabChange,
  timeline,
  timelineLoading,
  moveFlow,
  moveFlowLoading,
}: AccountOverviewProps) {
  const netFlowUsd =
    moveFlow && movePrice != null
      ? (Number(moveFlow.netFlow) / 1e8) * movePrice
      : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {/* Card 1: Overview */}
      <div className={CARD_CLASS}>
        <h3 className={TITLE_CLASS}>OVERVIEW</h3>
        <div className="space-y-4">
          {/* MOVE Balance */}
          <div>
            <div className={LABEL_CLASS}>MOVE Balance</div>
            {isLoading ? (
              <EnhancedSkeleton className="h-7 w-40 mt-1" />
            ) : (
              <div className="text-xl font-semibold font-mono tabular-nums mt-0.5">
                {formattedBalance} MOVE
              </div>
            )}
          </div>
          {/* USD Value */}
          <div>
            <div className={LABEL_CLASS}>MOVE Value</div>
            {isLoading ? (
              <EnhancedSkeleton className="h-5 w-28 mt-1" />
            ) : (
              <div className="text-sm text-foreground mt-0.5">
                {balanceUSD ? balanceUSD : "$0.00"}
                {movePrice != null && (
                  <span className="text-muted-foreground">
                    {" "}
                    (@ ${movePrice.toFixed(4)}/MOVE)
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Holdings — compressed single row */}
          <div>
            <div className={LABEL_CLASS}>Token Holdings</div>
            {isLoading ? (
              <EnhancedSkeleton className="h-5 w-40 mt-1" />
            ) : (
              <AccountTokenHoldingsDropdown
                address={address}
                onViewAll={() => onTabChange("coins")}
              />
            )}
          </div>
        </div>
      </div>

      {/* Card 2: MOVE Flow */}
      <div className={CARD_CLASS}>
        <h3 className={TITLE_CLASS}>MOVE FLOW</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={LABEL_CLASS}>Total In</span>
            {moveFlowLoading ? (
              <EnhancedSkeleton className="h-4 w-28" />
            ) : moveFlow ? (
              <span className="text-sm font-mono tabular-nums text-green-500">
                {formatTokenAmount(moveFlow.totalInflow, 8, 2)} MOVE
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className={LABEL_CLASS}>Total Out</span>
            {moveFlowLoading ? (
              <EnhancedSkeleton className="h-4 w-28" />
            ) : moveFlow ? (
              <span className="text-sm font-mono tabular-nums text-red-500">
                {formatTokenAmount(moveFlow.totalOutflow, 8, 2)} MOVE
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className={LABEL_CLASS}>Net Flow</span>
            {moveFlowLoading ? (
              <EnhancedSkeleton className="h-4 w-32" />
            ) : moveFlow ? (
              <div className="flex flex-col items-end">
                <span
                  className={cn(
                    "text-sm font-mono tabular-nums",
                    moveFlow.netFlow >= BigInt(0)
                      ? "text-green-500"
                      : "text-red-500",
                  )}
                >
                  {moveFlow.netFlow >= BigInt(0) ? "+" : ""}
                  {formatTokenAmount(moveFlow.netFlow, 8, 2)} MOVE
                </span>
                {netFlowUsd != null && (
                  <span className="text-sm text-muted-foreground">
                    (~
                    {netFlowUsd.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    )
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-xs text-muted-foreground/70 flex items-start gap-1.5">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            <span>
              Flow data is based on Coin v1 events only and may not reflect all
              Fungible Asset v2 transactions. Net Flow may differ from the
              actual balance.
            </span>
          </p>
        </div>
      </div>

      {/* Card 3: More Info */}
      <div className={CARD_CLASS}>
        <h3 className={TITLE_CLASS}>MORE INFO</h3>
        <div className="space-y-3">
          {/* Transactions Sent */}
          {accountData && (
            <div className="flex items-center justify-between">
              <span className={LABEL_CLASS}>Transactions Sent</span>
              {isLoading ? (
                <EnhancedSkeleton className="h-5 w-14" />
              ) : (
                <span className="text-sm font-medium tabular-nums">
                  {accountData.sequence_number
                    ? Number(accountData.sequence_number).toLocaleString()
                    : "0"}
                </span>
              )}
            </div>
          )}

          {/* Timeline */}
          {timelineLoading ? (
            <EnhancedSkeleton className="h-4 w-48" />
          ) : timeline ? (
            <>
              <div className="flex items-center justify-between">
                <span className={LABEL_CLASS}>Latest Txn</span>
                <a
                  href={`/txn/${timeline.lastSeenVersion}`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
                  title={formatDateTimeUTC(timeline.lastSeenTimestamp)}
                >
                  {formatAge(timeline.lastSeenTimestamp)}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className={LABEL_CLASS}>First Txn</span>
                <a
                  href={`/txn/${timeline.firstSeenVersion}`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
                  title={formatDateTimeUTC(timeline.firstSeenTimestamp)}
                >
                  {formatAge(timeline.firstSeenTimestamp)}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            </>
          ) : null}

          {/* Auth Key */}
          {accountData?.authentication_key && (
            <div className="flex items-center justify-between">
              <span className={LABEL_CLASS}>Auth Key</span>
              <CopyableAddress
                address={accountData.authentication_key}
                showCopyButton
                className="text-sm"
                copyTooltip="Copy auth key"
              />
            </div>
          )}

          {/* Object Owner */}
          {objectData?.data?.owner && (
            <div className="flex items-center justify-between gap-2">
              <span className={LABEL_CLASS}>Owner</span>
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
              <span className={LABEL_CLASS}>Transferrable</span>
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
