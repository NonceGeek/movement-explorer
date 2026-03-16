"use client";

import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { type FungibleAssetActivity } from "@/hooks/transactions/useGetTransactionBalanceChanges";
import { DetailRow } from "./DetailRow";
import { cn } from "@/utils/styling";

interface FungibleAssetTransfersRowProps {
  activities: FungibleAssetActivity[];
  senderAddress: string;
  onTabChange: (tab: string) => void;
}

function formatAmount(amount: number, decimals: number): string {
  const divisor = Math.pow(10, decimals);
  const value = amount / divisor;
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  });
}

export function FungibleAssetTransfersRow({
  activities,
  senderAddress,
  onTabChange,
}: FungibleAssetTransfersRowProps) {
  const transfers = activities.filter((a) => {
    if (a.type.includes("GasFee")) return false;
    if (a.owner_address?.toLowerCase() !== senderAddress?.toLowerCase())
      return false;
    return true;
  });

  if (transfers.length === 0) return null;

  return (
    <DetailRow
      label={`Fungible Asset Transfers (${transfers.length})`}
      tooltip="Token movements for the transaction sender"
      labelClassName="items-start"
    >
      <div className="space-y-1.5">
        <button
          onClick={() => onTabChange("balance")}
          className="text-xs text-primary hover:underline transition-colors flex items-center gap-1"
        >
          View full breakdown
          <ExternalLink className="h-3 w-3" />
        </button>

        {transfers.map((activity, i) => {
          const isDeposit = activity.type.includes("Deposit");
          const decimals = activity.metadata?.decimals ?? 8;
          const symbol = activity.metadata?.symbol ?? "FA";
          const formattedAmount = formatAmount(activity.amount, decimals);

          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              {isDeposit ? (
                <ArrowDown className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
              <span
                className={cn(
                  "font-mono",
                  isDeposit ? "text-green-500" : "text-red-400",
                )}
              >
                {isDeposit ? "+" : "-"}
                {formattedAmount}
              </span>
              <span className="text-muted-foreground">{symbol}</span>
            </div>
          );
        })}
      </div>
    </DetailRow>
  );
}
