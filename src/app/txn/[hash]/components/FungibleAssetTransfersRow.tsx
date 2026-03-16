"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
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

interface UnpairedActivity {
  kind: "unpaired";
  isDeposit: boolean;
  address: string;
  amount: number;
  decimals: number;
  symbol: string;
}

type DisplayRow = PairedTransfer | UnpairedActivity;

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

    for (const w of withdrawals) {
      const matchIdx = deposits.findIndex(
        (d, idx) => !usedDeposits.has(idx) && d.amount === w.amount,
      );

      if (matchIdx !== -1) {
        usedDeposits.add(matchIdx);
        const d = deposits[matchIdx];
        rows.push({
          kind: "paired",
          from: w.owner_address,
          to: d.owner_address,
          amount: w.amount,
          decimals: w.metadata?.decimals ?? d.metadata?.decimals ?? 8,
          symbol: w.metadata?.symbol ?? d.metadata?.symbol ?? "FA",
        });
      } else if (
        w.owner_address?.toLowerCase() === senderAddress?.toLowerCase()
      ) {
        rows.push({
          kind: "unpaired",
          isDeposit: false,
          address: w.owner_address,
          amount: w.amount,
          decimals: w.metadata?.decimals ?? 8,
          symbol: w.metadata?.symbol ?? "FA",
        });
      }
    }

    // Remaining unmatched deposits — only show sender's
    deposits.forEach((d, idx) => {
      if (
        !usedDeposits.has(idx) &&
        d.owner_address?.toLowerCase() === senderAddress?.toLowerCase()
      ) {
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

  return rows;
}

export function FungibleAssetTransfersRow({
  activities,
  senderAddress,
  onTabChange,
}: FungibleAssetTransfersRowProps) {
  const rows = buildDisplayRows(activities, senderAddress);

  if (rows.length === 0) return null;

  return (
    <DetailRow
      label={`Token Transfers (${rows.length})`}
      tooltip="Paired transfers show From → To. Unpaired entries (due to fees or complex routing) show the sender's balance changes only."
      labelClassName="items-start"
    >
      <div className="space-y-2">
        {rows.map((row, i) => {
          const fromContent =
            row.kind === "paired" ? (
              <CopyableAddress
                address={row.from}
                href={`/account/${row.from}`}
                showCopyButton={false}
                showLabel
              />
            ) : row.isDeposit ? (
              <span className="text-muted-foreground/50 text-xs font-mono">···</span>
            ) : (
              <CopyableAddress
                address={row.address}
                href={`/account/${row.address}`}
                showCopyButton={false}
                showLabel
              />
            );

          const toContent =
            row.kind === "paired" ? (
              <CopyableAddress
                address={row.to}
                href={`/account/${row.to}`}
                showCopyButton={false}
                showLabel
              />
            ) : row.isDeposit ? (
              <CopyableAddress
                address={row.address}
                href={`/account/${row.address}`}
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
                <span className="text-muted-foreground text-xs w-9 sm:w-auto shrink-0">From</span>
                {fromContent}
              </div>

              {/* Mobile: vertical connector line; Desktop: arrow */}
              <div className="sm:hidden flex items-center gap-2 py-0.5">
                <span className="w-9 shrink-0 flex justify-center">
                  <span className="block w-px h-3 bg-border/60" />
                </span>
              </div>
              <ArrowRight className="hidden sm:block h-3 w-3 text-muted-foreground shrink-0" />

              {/* To */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-9 sm:w-auto shrink-0">To</span>
                {toContent}
              </div>

              {/* Amount */}
              <div className="flex items-center gap-1.5 mt-1.5 sm:mt-0 sm:ml-1">
                <span className="font-mono text-foreground font-medium">
                  {formatAmount(row.amount, row.decimals)}
                </span>
                <span className="text-muted-foreground text-xs">{row.symbol}</span>
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
