import { Types } from "aptos";
import React, { useMemo, useState } from "react";
import { BalanceChangeTable } from "./BalanceChangeTable";
import {
  BalanceChange,
  getAssetSymbol,
  AggregatedBalance,
} from "@/utils/transaction";
import {
  useGetTransactionBalanceChanges,
  FungibleAssetActivity,
} from "@/hooks/transactions/useGetTransactionBalanceChanges";
import { tryStandardizeAddress } from "@/utils";
import { Button } from "@/components/ui/button";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { CoinDescription } from "@/hooks/coins/types";

interface BalanceChangeTabProps {
  transaction: Types.Transaction;
}

enum BalanceViewType {
  NON_AGGREGATED,
  AGGREGATED,
}

function aggregateBalanceChanges(
  changes: BalanceChange[],
): AggregatedBalance[] {
  const balanceMap = new Map<string, AggregatedBalance>();

  changes.forEach((change) => {
    const key = `${change.address}-${change.asset.id}`;

    if (balanceMap.has(key)) {
      const existing = balanceMap.get(key)!;
      existing.totalAmount += change.amount;
    } else {
      balanceMap.set(key, {
        address: change.address,
        asset: change.asset,
        totalAmount: change.amount,
        known: change.known,
        isInPanoraTokenList: change.isInPanoraTokenList,
        isBanned: change.isBanned,
        logoUrl: change.logoUrl,
        panoraTags: change.panoraTags,
      });
    }
  });

  return Array.from(balanceMap.values())
    .filter((entry) => entry.totalAmount !== BigInt(0))
    .sort((a, b) => {
      // First sort by address
      const addressCompare = a.address.localeCompare(b.address);
      if (addressCompare !== 0) return addressCompare;

      // Then by asset id
      return a.asset.id.localeCompare(b.asset.id);
    });
}

function findCoinData(
  coinData: CoinDescription[] | undefined,
  asset_type: string,
): CoinDescription | undefined {
  let entry: CoinDescription | undefined;
  if (coinData && asset_type) {
    const coinType = asset_type.includes("::")
      ? asset_type.split("::")[0]
      : undefined;
    const faAddress = asset_type && tryStandardizeAddress(asset_type);
    entry = coinData.find((c) => {
      const isMatchingFa =
        faAddress &&
        c.faAddress &&
        tryStandardizeAddress(faAddress) === tryStandardizeAddress(c.faAddress);
      const isMatchingCoin =
        coinType && c.tokenAddress && c.tokenAddress === coinType;
      const isMatchingFullCoinType =
        asset_type && c.tokenAddress && c.tokenAddress === asset_type;
      return isMatchingCoin || isMatchingFa || isMatchingFullCoinType;
    });
  }
  return entry;
}

export function BalanceChangeTab({ transaction }: BalanceChangeTabProps) {
  const { data: coinData } = useGetCoinList();
  const [viewType, setViewType] = useState(BalanceViewType.NON_AGGREGATED);

  const version = "version" in transaction ? transaction.version : undefined;

  const { data: transactionChangesResponse, isLoading } =
    useGetTransactionBalanceChanges(version ?? "");

  function convertAddress(a: FungibleAssetActivity) {
    return a.type.includes("GasFeeEvent")
      ? (a.gas_fee_payer_address ?? a.owner_address)
      : a.owner_address;
  }

  function convertType(activity: FungibleAssetActivity) {
    if (activity.type.includes("GasFee")) {
      return "Gas Fee";
    }
    if (activity.type.includes("Withdraw")) {
      return "Withdraw";
    }
    if (activity.type.includes("Deposit")) {
      return "Deposit";
    }
    if (activity.type.includes("StorageRefund")) {
      return "Storage Refund";
    }

    return "Unknown";
  }

  function convertAmount(activity: FungibleAssetActivity) {
    if (activity.type.includes("GasFeeEvent")) {
      return -BigInt(activity.amount);
    }
    if (activity.type.includes("Withdraw")) {
      return BigInt(-activity.amount);
    }
    return BigInt(activity.amount);
  }

  const balanceChanges = useMemo(() => {
    if (!transactionChangesResponse?.fungible_asset_activities) return [];

    const activities = transactionChangesResponse.fungible_asset_activities;

    // Find gas fee event to filter out duplicate withdraw events
    const gasFeeActivity = activities.find((a) =>
      a.type.includes("GasFeeEvent"),
    );

    const gasFeePayerAddress = gasFeeActivity
      ? (gasFeeActivity.gas_fee_payer_address ?? gasFeeActivity.owner_address)
      : null;
    const gasFeeAmount = gasFeeActivity?.amount ?? 0;

    const changes: BalanceChange[] = activities
      .filter((a) => a.amount !== null)
      .filter((a) => {
        // Filter out Withdraw events that duplicate the GasFeeEvent
        if (
          gasFeeActivity &&
          a.type.includes("Withdraw") &&
          !a.type.includes("GasFee") &&
          a.amount === gasFeeAmount &&
          (a.owner_address === gasFeePayerAddress ||
            a.gas_fee_payer_address === gasFeePayerAddress)
        ) {
          return false; // Skip this duplicate withdraw event
        }
        return true;
      })
      .map((a) => {
        const entry = findCoinData(coinData?.data, a.asset_type);

        // Fallback logo for MOVE token
        const isMoveCoin = a.asset_type === "0x1::aptos_coin::AptosCoin";
        const isMoveFa =
          a.asset_type === "0xa" ||
          a.asset_type ===
            "0x000000000000000000000000000000000000000000000000000000000000000a";
        const fallbackLogoUrl =
          isMoveCoin || isMoveFa ? "/coinLogo.png" : undefined;

        return {
          address: convertAddress(a),
          amount: convertAmount(a),
          type: convertType(a),
          asset: {
            decimals: a.metadata?.decimals ?? 8,
            symbol:
              getAssetSymbol(
                entry?.panoraSymbol ?? undefined,
                entry?.bridge ?? undefined,
                a.metadata?.symbol,
              ) || "FA",
            type: a.type,
            id: entry?.tokenAddress ?? a.asset_type,
          },
          known: entry !== undefined,
          isInPanoraTokenList: entry?.isInPanoraTokenList,
          isBanned: entry?.isBanned,
          logoUrl: entry?.logoUrl ?? fallbackLogoUrl,
          panoraTags: entry?.panoraTags ?? [],
        };
      });

    // Add storage refund event if present
    if (gasFeeActivity && (gasFeeActivity.storage_refund_amount ?? 0) > 0) {
      // Storage refund is always MOVE token
      const isMoveCoin =
        gasFeeActivity.asset_type === "0x1::aptos_coin::AptosCoin";
      const isMoveFa =
        gasFeeActivity.asset_type === "0xa" ||
        gasFeeActivity.asset_type ===
          "0x000000000000000000000000000000000000000000000000000000000000000a";
      const storageRefundLogoUrl =
        isMoveCoin || isMoveFa ? "/coinLogo.png" : undefined;

      changes.push({
        address:
          gasFeeActivity.gas_fee_payer_address ?? gasFeeActivity.owner_address,
        amount: BigInt(gasFeeActivity.storage_refund_amount),
        type: "Storage Refund",
        asset: {
          decimals: gasFeeActivity.metadata?.decimals ?? 8,
          symbol: gasFeeActivity.metadata?.symbol ?? "MOVE",
          type: "v1", // placeholder
          id: gasFeeActivity.asset_type,
        },
        known: true,
        isBanned: false,
        isInPanoraTokenList: true,
        panoraTags: [],
        logoUrl: storageRefundLogoUrl,
      });
    }

    return changes;
  }, [transactionChangesResponse]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <EnhancedSkeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (balanceChanges.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center text-muted-foreground">
          No balance changes found
        </CardContent>
      </Card>
    );
  }

  const displayedChanges =
    viewType === BalanceViewType.AGGREGATED
      ? aggregateBalanceChanges(balanceChanges).map((agg) => ({
          ...agg,
          amount: agg.totalAmount,
          type: "Net Change",
          asset: agg.asset, // ensure asset is passed
        }))
      : balanceChanges;

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2 text-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewType(BalanceViewType.NON_AGGREGATED)}
          className={
            viewType === BalanceViewType.NON_AGGREGATED
              ? "text-primary font-bold bg-primary/10"
              : "text-muted-foreground"
          }
        >
          Non-aggregated
        </Button>
        <div className="w-px bg-border h-6 my-auto" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewType(BalanceViewType.AGGREGATED)}
          className={
            viewType === BalanceViewType.AGGREGATED
              ? "text-primary font-bold bg-primary/10"
              : "text-muted-foreground"
          }
        >
          Aggregated
        </Button>
      </div>

      <BalanceChangeTable changes={displayedChanges} />
    </div>
  );
}
