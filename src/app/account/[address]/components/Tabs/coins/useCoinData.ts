import { useGetAccountCoins } from "@/hooks/accounts/useGetAccountCoins";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { CoinDescription } from "@/hooks/coins/types";
import { useGlobalStore } from "@/store/useGlobalStore";
import { verifiedLevel, VerifiedType } from "@/utils/coinVerification";
import { useMemo, useState, useEffect } from "react";
import { CoinRow, CoinFilter } from "./types";

function findCoinData(
  coins: CoinDescription[],
  assetType: string,
): CoinDescription | undefined {
  return coins.find(
    (coin) => coin.tokenAddress === assetType || coin.faAddress === assetType,
  );
}

export function useCoinData(address: string) {
  const { data: accountCoins, isLoading } = useGetAccountCoins(address);
  const { data: coinListData } = useGetCoinList();
  const { network_name } = useGlobalStore();
  const [filter, setFilter] = useState<CoinFilter>("all");

  useEffect(() => {
    if (network_name === "mainnet") {
      setFilter("verified");
    }
  }, [network_name]);

  const coins = useMemo<CoinRow[]>(() => {
    const list = coinListData?.data ?? [];
    const balances = accountCoins ?? [];

    return balances
      .map((coin) => {
        const foundCoin = findCoinData(list, coin.asset_type_v2);
        const decimals = foundCoin?.decimals ?? coin.metadata.decimals ?? 8;
        const amount = coin.amount_v2 / 10 ** decimals;
        const usdPrice = foundCoin?.usdPrice
          ? Number(foundCoin.usdPrice)
          : null;
        const usdValue = usdPrice !== null ? usdPrice * amount : null;
        const panoraTags = foundCoin?.panoraTags ?? [];
        const isCoin = coin.asset_type_v2.includes("::");
        const verificationId =
          !isCoin && foundCoin?.tokenAddress
            ? foundCoin.tokenAddress
            : coin.asset_type_v2;
        const known = foundCoin ? foundCoin.chainId !== 0 : false;
        const verification = verifiedLevel(
          {
            id: verificationId,
            known,
            isBanned: foundCoin?.isBanned,
            isInPanoraTokenList: foundCoin?.isInPanoraTokenList,
            symbol: foundCoin?.symbol || coin.metadata.symbol,
            panoraTags,
          },
          network_name,
        );

        const tokenStandard: "v1" | "v2" = coin.is_v1_coin ? "v1" : "v2";
        const isMoveCoin = coin.asset_type_v2 === "0x1::aptos_coin::AptosCoin";
        const isMoveFa =
          coin.asset_type_v2 === "0xa" ||
          coin.asset_type_v2 ===
            "0x000000000000000000000000000000000000000000000000000000000000000a";
        const fallbackLogoUrl = isMoveCoin || isMoveFa ? "/coinLogo.png" : null;

        return {
          assetType: coin.asset_type_v2,
          name: foundCoin?.name || coin.metadata.name || coin.asset_type_v2,
          symbol: foundCoin?.symbol || coin.metadata.symbol || "-",
          decimals,
          tokenStandard,
          amount,
          usdPrice,
          usdValue,
          verification,
          logoUrl: foundCoin?.logoUrl ?? fallbackLogoUrl,
        };
      })
      .sort((a, b) => {
        const aValue = a.usdValue ?? -1;
        const bValue = b.usdValue ?? -1;
        if (bValue !== aValue) return bValue - aValue;
        return a.name.localeCompare(b.name);
      });
  }, [accountCoins, coinListData?.data, network_name]);

  const filteredCoins = useMemo(() => {
    switch (filter) {
      case "verified":
        return coins.filter((coin) =>
          [
            VerifiedType.NATIVE_TOKEN,
            VerifiedType.LABS_VERIFIED,
            VerifiedType.COMMUNITY_VERIFIED,
          ].includes(coin.verification.level),
        );
      case "recognized":
        return coins.filter((coin) =>
          [
            VerifiedType.NATIVE_TOKEN,
            VerifiedType.LABS_VERIFIED,
            VerifiedType.COMMUNITY_VERIFIED,
            VerifiedType.RECOGNIZED,
          ].includes(coin.verification.level),
        );
      case "all":
      default:
        return coins;
    }
  }, [coins, filter]);

  // Calculate total USD value of all coins (not filtered)
  const totalUsdValue = useMemo(() => {
    return coins.reduce((sum, coin) => sum + (coin.usdValue ?? 0), 0);
  }, [coins]);

  return {
    filteredCoins,
    isLoading,
    filter,
    setFilter,
    totalUsdValue,
    coins, // expose raw coins for checking if user has any coins at all
  };
}
