import { useMemo } from "react";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { CoinDescription } from "@/hooks/coins/types";
import { getAssetSymbol } from "@/utils/transaction";
import { tryStandardizeAddress } from "@/utils";
import {
  AccountCoinTransferAsset,
  useGetAccountCoinTransferAssets,
} from "./useGetAccountCoinTransferAssets";
import type { TokenOption } from "@/components/transactions/filters/CoinColumnFilter";

function isMoveAssetType(assetType: string) {
  const normalized = assetType.includes("::")
    ? null
    : tryStandardizeAddress(assetType);

  return (
    assetType === "0x1::aptos_coin::AptosCoin" ||
    assetType === "0xa" ||
    normalized ===
      "0x000000000000000000000000000000000000000000000000000000000000000a"
  );
}

function findCoinData(coins: CoinDescription[], assetType: string) {
  const normalizedAsset = assetType.includes("::")
    ? null
    : tryStandardizeAddress(assetType);

  return coins.find((coin) => {
    const normalizedFa = coin.faAddress
      ? tryStandardizeAddress(coin.faAddress)
      : null;

    return (
      coin.tokenAddress === assetType ||
      coin.faAddress === assetType ||
      (!!normalizedAsset && normalizedFa === normalizedAsset)
    );
  });
}

function getCoinLabel(coin: CoinDescription) {
  return (
    getAssetSymbol(
      coin.panoraSymbol ?? undefined,
      coin.bridge ?? undefined,
      coin.symbol,
    ) || coin.symbol
  );
}

function getMetadataLabel(asset: AccountCoinTransferAsset) {
  const symbol = asset.metadata?.symbol;

  if (isMoveAssetType(asset.asset_type) || symbol === "AptosCoin") {
    return "MOVE";
  }

  if (symbol && symbol !== "FA" && symbol !== "Metadata") {
    return symbol;
  }

  if (asset.asset_type.includes("::")) {
    const fallback = asset.asset_type.split("::").pop();
    if (fallback && fallback !== "Metadata") return fallback;
  }

  return `${asset.asset_type.slice(0, 6)}...${asset.asset_type.slice(-4)}`;
}

function getShortAssetType(assetType: string) {
  if (assetType.includes("::")) {
    return assetType.split("::").pop() ?? assetType;
  }

  return `${assetType.slice(0, 6)}...${assetType.slice(-4)}`;
}

function hasSuspiciousText(values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join(" ").toLowerCase();

  const looksLikeUrl =
    /https?:\/\//.test(text) ||
    /\bwww\./.test(text) ||
    /\b[a-z0-9-]+\.(com|net|org|xyz|io|app|site|top|link|move)\b/.test(text);

  if (looksLikeUrl) return true;

  return [
    "airdrop",
    "bonus",
    "claim",
    "drop",
    "drops",
    "free",
    "gift",
    "giveaway",
    "promo",
    "reward",
    "rwd",
    ".com",
    ".net",
    ".org",
    ".xyz",
  ].some((keyword) => text.includes(keyword));
}

function isSuspiciousToken(
  asset: AccountCoinTransferAsset,
  coin?: CoinDescription,
) {
  if (isMoveAssetType(asset.asset_type)) return false;

  return hasSuspiciousText([
    asset.metadata?.name,
    asset.metadata?.symbol,
    asset.asset_type,
    coin?.name,
    coin?.symbol,
    coin?.panoraSymbol,
  ]);
}

export function useGetAccountCoinTransferTokenOptions(address: string): {
  data: TokenOption[] | undefined;
  isLoading: boolean;
} {
  const { data: assets, isLoading: assetsLoading } =
    useGetAccountCoinTransferAssets(address);
  const { data: coinListData, isLoading: coinsLoading } = useGetCoinList();

  const data = useMemo(() => {
    if (!assets) return undefined;

    const coins = coinListData?.data ?? [];
    const seen = new Set<string>();

    const options = assets
      .map((asset): TokenOption | null => {
        if (seen.has(asset.asset_type)) return null;
        seen.add(asset.asset_type);

        const coin = findCoinData(coins, asset.asset_type);
        if (isSuspiciousToken(asset, coin)) return null;

        const label = coin ? getCoinLabel(coin) : getMetadataLabel(asset);

        return {
          label,
          name: coin?.name ?? asset.metadata?.name ?? label,
          value: asset.asset_type,
          tokenAddress: coin?.tokenAddress ?? null,
          logoUrl: coin?.logoUrl ?? null,
        };
      })
      .filter((option): option is TokenOption => option !== null);

    const labelCounts = options.reduce<Record<string, number>>(
      (counts, option) => {
        const key = option.label.toLowerCase();
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      },
      {},
    );

    return options
      .map((option) => ({
        ...option,
        subtext:
          labelCounts[option.label.toLowerCase()] > 1
            ? getShortAssetType(option.value)
            : option.subtext,
      }))
      .sort((a, b) => {
        const labelCompare = a.label.localeCompare(b.label);
        if (labelCompare !== 0) return labelCompare;
        return (a.subtext ?? "").localeCompare(b.subtext ?? "");
      });
  }, [assets, coinListData?.data]);

  return {
    data,
    isLoading: assetsLoading || coinsLoading,
  };
}
