"use client";

import { ArrowDownLeft, ArrowUpRight, ArrowRight, ExternalLink } from "lucide-react";
import { type FungibleAssetActivity } from "@/hooks/transactions/useGetTransactionBalanceChanges";
import { DetailRow } from "./DetailRow";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { cn } from "@/utils/styling";

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
  const relevant = activities.filter((a) => !a.type.includes("GasFee"));

  // Group by asset_type
  const byAsset = new Map<string, FungibleAssetActivity[]>();
  for (const a of relevant) {
    if (!byAsset.has(a.asset_type)) byAsset.set(a.asset_type, []);
    byAsset.get(a.asset_type)!.push(a);
  }

  const rows: DisplayRow[] = [];

  for (const assetActivities of byAsset.values()) {
    const withdrawals = assetActivities.filter((a) => a.type.includes("Withdraw"));
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
      } else if (w.owner_address?.toLowerCase() === senderAddress?.toLowerCase()) {
        rows.push({
          kind: "unpaired",
          isDeposit: false,
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
        <button
          onClick={() => onTabChange("balance")}
          className="text-xs text-primary hover:underline transition-colors flex items-center gap-1"
        >
          View Balance Changes
          <ExternalLink className="h-3 w-3" />
        </button>

        {rows.map((row, i) =>
          row.kind === "paired" ? (
            <div key={i} className="flex items-center gap-1.5 text-sm flex-wrap">
              <span className="text-muted-foreground text-xs shrink-0">From</span>
              <CopyableAddress
                address={row.from}
                href={`/account/${row.from}`}
                showCopyButton={false}
                showLabel
              />
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs shrink-0">To</span>
              <CopyableAddress
                address={row.to}
                href={`/account/${row.to}`}
                showCopyButton={false}
                showLabel
              />
              <span className="text-muted-foreground text-xs shrink-0">For</span>
              <span className="font-mono text-foreground">
                {formatAmount(row.amount, row.decimals)}
              </span>
              <span className="text-muted-foreground">{row.symbol}</span>
            </div>
          ) : (
            <div key={i} className="flex items-center gap-2 text-sm">
              {row.isDeposit ? (
                <ArrowDownLeft className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
              <span
                className={cn(
                  "font-mono",
                  row.isDeposit ? "text-green-500" : "text-red-400",
                )}
              >
                {row.isDeposit ? "+" : "-"}
                {formatAmount(row.amount, row.decimals)}
              </span>
              <span className="text-muted-foreground">{row.symbol}</span>
            </div>
          ),
        )}
      </div>
    </DetailRow>
  );
}
