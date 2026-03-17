"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { type FungibleAssetActivity } from "@/hooks/transactions/useGetTransactionBalanceChanges";
import { DetailRow } from "./DetailRow";
import { CopyableAddress } from "@/components/common/CopyableAddress";

interface FungibleAssetTransfersRowProps {
  activities: FungibleAssetActivity[];
  senderAddress: string;
  onTabChange: (tab: string) => void;
}

interface PairedTransfer {
  kind: "paired";
  from: string;
  to: string;
  amount: number;
  decimals: number;
  symbol: string;
}

interface MultiRecipientTransfer {
  kind: "multi";
  from: string;
  recipients: Array<{ address: string; amount: number }>;
  totalAmount: number;
  decimals: number;
  symbol: string;
}

interface UnpairedActivity {
  kind: "unpaired";
  isDeposit: boolean;
  address: string;
  amount: number;
  decimals: number;
  symbol: string;
}

type DisplayRow = PairedTransfer | MultiRecipientTransfer | UnpairedActivity;

function formatAmount(amount: number, decimals: number): string {
  const divisor = Math.pow(10, decimals);
  const value = amount / divisor;
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  });
}

function buildDisplayRows(
  activities: FungibleAssetActivity[],
  senderAddress: string,
): DisplayRow[] {
  // Find gas fee event to filter out its duplicate Withdraw
  const gasFeeActivity = activities.find((a) => a.type.includes("GasFeeEvent"));
  const gasFeePayerAddress = gasFeeActivity
    ? (gasFeeActivity.gas_fee_payer_address ?? gasFeeActivity.owner_address)
    : null;
  const gasFeeAmount = gasFeeActivity?.amount ?? 0;

  const relevant = activities.filter((a) => {
    if (a.type.includes("GasFee")) return false;
    // Filter out the Withdraw that duplicates the GasFeeEvent
    if (
      gasFeeActivity &&
      a.type.includes("Withdraw") &&
      a.amount === gasFeeAmount &&
      (a.owner_address === gasFeePayerAddress ||
        a.gas_fee_payer_address === gasFeePayerAddress)
    ) {
      return false;
    }
    return true;
  });

  // Group by asset_type
  const byAsset = new Map<string, FungibleAssetActivity[]>();
  for (const a of relevant) {
    if (!byAsset.has(a.asset_type)) byAsset.set(a.asset_type, []);
    byAsset.get(a.asset_type)!.push(a);
  }

  const rows: DisplayRow[] = [];

  for (const assetActivities of byAsset.values()) {
    const withdrawals = assetActivities.filter((a) =>
      a.type.includes("Withdraw"),
    );
    const deposits = assetActivities.filter((a) => a.type.includes("Deposit"));
    const usedDeposits = new Set<number>();
    const usedWithdrawals = new Set<number>();

    for (let wIdx = 0; wIdx < withdrawals.length; wIdx++) {
      const w = withdrawals[wIdx];
      const matchIdx = deposits.findIndex(
        (d, idx) => !usedDeposits.has(idx) && d.amount === w.amount,
      );

      if (matchIdx !== -1) {
        usedDeposits.add(matchIdx);
        usedWithdrawals.add(wIdx);
        const d = deposits[matchIdx];
        rows.push({
          kind: "paired",
          from: w.owner_address,
          to: d.owner_address,
          amount: w.amount,
          decimals: w.metadata?.decimals ?? d.metadata?.decimals ?? 8,
          symbol: w.metadata?.symbol ?? d.metadata?.symbol ?? "FA",
        });
      }
    }

    // Collect unmatched withdrawals from sender and unmatched deposits
    const unmatchedSenderWithdrawals = withdrawals.filter(
      (w, idx) =>
        !usedWithdrawals.has(idx) &&
        w.owner_address?.toLowerCase() === senderAddress?.toLowerCase(),
    );
    const unmatchedDeposits = deposits.filter(
      (_, idx) => !usedDeposits.has(idx),
    );

    if (unmatchedSenderWithdrawals.length > 0 && unmatchedDeposits.length > 0) {
      // 1:N — show multi-recipient row (click to expand)
      const sample = unmatchedSenderWithdrawals[0];
      rows.push({
        kind: "multi",
        from: sample.owner_address,
        recipients: unmatchedDeposits.map((d) => ({
          address: d.owner_address,
          amount: d.amount,
        })),
        totalAmount: unmatchedDeposits.reduce((sum, d) => sum + d.amount, 0),
        decimals: sample.metadata?.decimals ?? 8,
        symbol: sample.metadata?.symbol ?? "FA",
      });
    } else {
      // Fallback: show unpaired sender withdrawals
      for (const w of unmatchedSenderWithdrawals) {
        rows.push({
          kind: "unpaired",
          isDeposit: false,
          address: w.owner_address,
          amount: w.amount,
          decimals: w.metadata?.decimals ?? 8,
          symbol: w.metadata?.symbol ?? "FA",
        });
      }

      // Remaining unmatched deposits — only show sender's
      unmatchedDeposits.forEach((d) => {
        if (d.owner_address?.toLowerCase() === senderAddress?.toLowerCase()) {
          rows.push({
            kind: "unpaired",
            isDeposit: true,
            address: d.owner_address,
            amount: d.amount,
            decimals: d.metadata?.decimals ?? 8,
            symbol: d.metadata?.symbol ?? "FA",
          });
        }
      });
    }
  }

  return rows;
}

export function FungibleAssetTransfersRow({
  activities,
  senderAddress,
  onTabChange,
}: FungibleAssetTransfersRowProps) {
  const rows = buildDisplayRows(activities, senderAddress);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  if (rows.length === 0) return null;

  const toggleExpand = (i: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <DetailRow
      label={`Token Transfers (${rows.length})`}
      tooltip="Paired transfers show From → To. For complex routing (1-to-many), click to expand recipients."
      labelClassName="items-start"
    >
      <div className="space-y-2">
        {rows.map((row, i) => {
          const isExpanded = expandedRows.has(i);

          if (row.kind === "multi") {
            return (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-start gap-0 sm:gap-1.5 text-sm rounded-lg bg-muted/20 sm:bg-transparent px-3 py-2 sm:p-0"
              >
                {/* From */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs w-9 sm:w-auto shrink-0">
                    From
                  </span>
                  <CopyableAddress
                    address={row.from}
                    href={`/account/${row.from}`}
                    showCopyButton={false}
                    showLabel
                  />
                </div>

                {/* Mobile: vertical connector line; Desktop: arrow */}
                <div className="sm:hidden flex items-center gap-2 py-0.5">
                  <span className="w-9 shrink-0 flex justify-center">
                    <span className="block w-px h-3 bg-border" />
                  </span>
                </div>
                {/* mt-1 centers the arrow with the first text line under items-start */}
                <ArrowRight className="hidden sm:block h-3 w-3 text-muted-foreground shrink-0 mt-1" />

                {/* To — flex-col: expanded list naturally aligns under "3 recipients" */}
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground text-xs w-9 sm:w-auto shrink-0 mt-0.5">
                    To
                  </span>
                  <div className="flex flex-col gap-1">
                    {/* Button + amount */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(i)}
                        className="flex items-center gap-1 text-sm text-primary cursor-pointer"
                      >
                        {row.recipients.length} recipients
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                        ) : (
                          <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                        )}
                      </button>
                      <div className="flex items-center gap-1.5 ml-1">
                        <span className="font-mono text-foreground font-medium">
                          {formatAmount(row.totalAmount, row.decimals)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {row.symbol}
                        </span>
                      </div>
                    </div>

                    {/* Expanded recipients — inside flex-col, aligns with "3 recipients" */}
                    {isExpanded && (
                      <div className="space-y-1 border-l border-border pl-3">
                        {row.recipients.map((r, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <CopyableAddress
                              address={r.address}
                              href={`/account/${r.address}`}
                              showCopyButton={false}
                              showLabel
                            />
                            <span className="font-mono text-muted-foreground ml-auto whitespace-nowrap">
                              {formatAmount(r.amount, row.decimals)} {row.symbol}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // paired | unpaired
          const fromAddr =
            row.kind === "paired" ? row.from : row.isDeposit ? null : row.address;
          const toAddr =
            row.kind === "paired" ? row.to : row.isDeposit ? row.address : null;
          const fromEl = fromAddr ? (
            <CopyableAddress
              address={fromAddr}
              href={`/account/${fromAddr}`}
              showCopyButton={false}
              showLabel
            />
          ) : (
            <span className="text-muted-foreground/50 text-xs font-mono">···</span>
          );
          const toEl = toAddr ? (
            <CopyableAddress
              address={toAddr}
              href={`/account/${toAddr}`}
              showCopyButton={false}
              showLabel
            />
          ) : (
            <span className="text-muted-foreground/50 text-xs font-mono">···</span>
          );

          return (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-1.5 text-sm rounded-lg bg-muted/20 sm:bg-transparent px-3 py-2 sm:p-0"
            >
              {/* From */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-9 sm:w-auto shrink-0">
                  From
                </span>
                {fromEl}
              </div>

              {/* Mobile: vertical connector line; Desktop: arrow */}
              <div className="sm:hidden flex items-center gap-2 py-0.5">
                <span className="w-9 shrink-0 flex justify-center">
                  <span className="block w-px h-3 bg-border/60" />
                </span>
              </div>
              <ArrowRight className="hidden sm:block h-3 w-3 text-muted-foreground shrink-0" />

              {/* To + Amount inline */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-9 sm:w-auto shrink-0">
                  To
                </span>
                {toEl}
                <div className="flex items-center gap-1.5 sm:ml-1">
                  <span className="font-mono text-foreground font-medium">
                    {formatAmount(row.amount, row.decimals)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {row.symbol}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <button
          onClick={() => onTabChange("balance")}
          className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors flex items-center gap-1 pt-0.5 cursor-pointer"
        >
          View Balance Changes
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </DetailRow>
  );
}
