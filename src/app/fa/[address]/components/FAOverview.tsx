"use client";

import { AssetOverview } from "@/components/common/AssetOverview";
import { FaMetadata } from "@/hooks/coins/useGetFaMetadata";
import { CoinDescription } from "@/hooks/coins/types";

interface FAOverviewProps {
  address: string;
  metadata: FaMetadata | null;
  supply: bigint | null;
  pairedCoin?: string;
  coinDescription?: CoinDescription;
  displaySymbol?: string;
  isLoading: boolean;
}

export function FAOverview({
  address,
  metadata,
  supply,
  pairedCoin,
  coinDescription,
  displaySymbol,
  isLoading,
}: FAOverviewProps) {
  const symbol = displaySymbol || metadata?.symbol || coinDescription?.symbol || "";
  const decimals = metadata?.decimals ?? coinDescription?.decimals ?? 8;
  const websiteUrl = coinDescription?.websiteUrl || metadata?.project_uri || undefined;

  return (
    <AssetOverview
      symbol={symbol}
      decimals={decimals}
      supply={supply}
      hasSupply={supply !== null}
      identifier={address}
      identifierLabel="Object"
      identifierHref={`/object/${address}`}
      pairedAsset={
        pairedCoin
          ? {
              address: pairedCoin,
              href: `/coin/${pairedCoin}`,
              label: "Paired Coin",
            }
          : undefined
      }
      websiteUrl={websiteUrl}
      usdPrice={coinDescription?.usdPrice}
      category={coinDescription?.category}
      panoraTags={coinDescription?.panoraTags}
      isLoading={isLoading}
    />
  );
}
