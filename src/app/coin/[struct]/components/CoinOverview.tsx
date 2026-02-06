"use client";

import { AssetOverview } from "@/components/common/AssetOverview";
import { CoinData } from "./InfoTab";
import { CoinDescription } from "@/hooks/coins/types";
import { SupplyType } from "@/hooks/coins/useGetCoinSupplyLimit";

interface CoinOverviewProps {
  struct: string;
  coinData: CoinData | undefined;
  coinDescription: CoinDescription | undefined;
  supplyInfo: [bigint | null, SupplyType | null];
  pairedFa: string | null;
  displaySymbol: string | undefined;
  isLoading: boolean;
}

export function CoinOverview({
  struct,
  coinData,
  coinDescription,
  supplyInfo,
  pairedFa,
  displaySymbol,
  isLoading,
}: CoinOverviewProps) {
  const [supply, supplyType] = supplyInfo;
  const creatorAddress = struct.split("::")[0];

  return (
    <AssetOverview
      symbol={displaySymbol || coinData?.data?.symbol || ""}
      decimals={coinData?.data?.decimals ?? coinDescription?.decimals ?? 8}
      supply={supply}
      supplyType={supplyType}
      identifier={struct}
      identifierLabel="Creator"
      identifierHref={`/account/${creatorAddress}`}
      creatorAddress={creatorAddress}
      pairedAsset={
        pairedFa
          ? {
              address: pairedFa,
              href: `/fa/${pairedFa}`,
              label: "Paired FA",
            }
          : undefined
      }
      websiteUrl={coinDescription?.websiteUrl || undefined}
      usdPrice={coinDescription?.usdPrice}
      category={coinDescription?.category}
      panoraTags={coinDescription?.panoraTags}
      isLoading={isLoading}
    />
  );
}
