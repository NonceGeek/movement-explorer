"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGetAccountCoins } from "@/hooks/accounts/useGetAccountCoins";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { useGetFaMetadata } from "@/hooks/coins/useGetFaMetadata";
import { CoinDescription } from "@/hooks/coins/types";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  labsBannedAddresses,
  labsBannedTokenSymbols,
  labsBannedTokens,
  nativeTokens,
} from "@/constants";
import { getEmojicoinMarketAddressAndTypeTags } from "@/hooks/coins/emojicoin";
import { Network } from "@aptos-labs/ts-sdk";
import {
  TableBody,
  TableCell,
  StyledTableRow as TableRow,
  StyledTable as Table,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Ban,
  BadgeCheck,
  CircleSlash,
  ShieldCheck,
  Coins,
} from "lucide-react";

type CoinRow = {
  assetType: string;
  name: string;
  symbol: string;
  decimals: number;
  tokenStandard: "v1" | "v2";
  amount: number;
  usdPrice: number | null;
  usdValue: number | null;
  verification: VerifiedLevelInfo;
  logoUrl: string | null;
};

type CoinFilter = "verified" | "recognized" | "all";

enum VerifiedType {
  NATIVE_TOKEN = "Native",
  LABS_VERIFIED = "Verified",
  COMMUNITY_VERIFIED = "Community Verified",
  RECOGNIZED = "Recognized",
  UNVERIFIED = "Unverified",
  LABS_BANNED = "Banned",
  COMMUNITY_BANNED = "Community Banned",
  DISABLED = "No Verification",
}

type VerifiedLevelInfo = {
  level: VerifiedType;
  reason?: string;
};

function verifiedLevel(
  input: {
    id: string;
    known: boolean;
    isBanned?: boolean;
    isInPanoraTokenList?: boolean;
    symbol?: string;
    panoraTags?: CoinDescription["panoraTags"];
  },
  network: string,
): VerifiedLevelInfo {
  const isCoin = input.id.includes("::");

  let emojicoinInfo: { coin: string; lp: string } | null = null;
  if (isCoin && input.symbol) {
    emojicoinInfo = getEmojicoinMarketAddressAndTypeTags({
      symbol: input.symbol,
    });
  }

  if (nativeTokens[input.id] || input.panoraTags?.includes("Native")) {
    return { level: VerifiedType.NATIVE_TOKEN };
  }
  if (input.panoraTags?.includes("Verified")) {
    return { level: VerifiedType.LABS_VERIFIED };
  }
  if (labsBannedTokens[input.id] || input.panoraTags?.includes("Banned")) {
    return {
      level: VerifiedType.LABS_BANNED,
      reason: labsBannedTokens[input.id],
    };
  }
  if (input.isBanned) {
    return { level: VerifiedType.COMMUNITY_BANNED };
  }
  if (network !== Network.MAINNET) {
    return {
      level: VerifiedType.DISABLED,
      reason: "Verification only enabled for Mainnet",
    };
  }
  if (isCoin && emojicoinInfo?.lp === input.id) {
    return {
      level: VerifiedType.LABS_VERIFIED,
      reason: "Verified as an Emojicoin LP",
    };
  }
  if (isCoin && emojicoinInfo?.coin === input.id) {
    return {
      level: VerifiedType.LABS_VERIFIED,
      reason: "Verified as an Emojicoin",
    };
  }
  if (isCoin && labsBannedAddresses[input.id.split("::")[0]]) {
    return {
      level: VerifiedType.LABS_BANNED,
      reason: labsBannedAddresses[input.id.split("::")[0]],
    };
  }
  if (
    input.symbol &&
    labsBannedTokenSymbols[input.symbol.toUpperCase() ?? ""]
  ) {
    return {
      level: VerifiedType.LABS_BANNED,
      reason: labsBannedTokenSymbols[input.symbol.toUpperCase() ?? ""],
    };
  }
  if (input.isInPanoraTokenList) {
    return { level: VerifiedType.COMMUNITY_VERIFIED };
  }
  if (input.known) {
    return { level: VerifiedType.RECOGNIZED };
  }

  return { level: VerifiedType.UNVERIFIED };
}

function getVerificationDisplay(level: VerifiedType, reason?: string) {
  switch (level) {
    case VerifiedType.NATIVE_TOKEN:
      return {
        label: "Native",
        icon: <ShieldCheck className="h-4 w-4 text-blue-500" />,
        tooltip: "This asset is verified as a native token of Movement.",
      };
    case VerifiedType.LABS_VERIFIED:
      return {
        label: "Verified",
        icon: <BadgeCheck className="h-4 w-4 text-blue-500" />,
        tooltip:
          "This asset is verified by the builders of the explorer." +
          (reason ? ` Reason: (${reason})` : ""),
      };
    case VerifiedType.COMMUNITY_VERIFIED:
      return {
        label: "Community",
        icon: <BadgeCheck className="h-4 w-4 text-blue-400" />,
        tooltip: "This asset is on the Movement tokens list",
      };
    case VerifiedType.RECOGNIZED:
      return {
        label: "Recognized",
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        tooltip:
          "This asset is recognized, but many not have been verified by the community.",
      };
    case VerifiedType.UNVERIFIED:
      return {
        label: "Unverified",
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
        tooltip:
          "This asset is not verified, it may or may not be recognized by the community.  Please use with caution.",
      };
    case VerifiedType.COMMUNITY_BANNED:
      return {
        label: "Banned",
        icon: <Ban className="h-4 w-4 text-red-500" />,
        tooltip:
          "This asset has been banned on the Panora token list, please avoid using this asset.",
      };
    case VerifiedType.LABS_BANNED:
      return {
        label: "Banned",
        icon: <Ban className="h-4 w-4 text-red-500" />,
        tooltip:
          "This asset has been marked as a scam or dangerous, please avoid using this asset." +
          (reason ? ` Reason: (${reason})` : ""),
      };
    case VerifiedType.DISABLED:
      return {
        label: "Disabled",
        icon: <CircleSlash className="h-4 w-4 text-muted-foreground" />,
        tooltip:
          "Verification disabled for non-Mainnet" +
          (reason ? ` Reason: (${reason})` : ""),
      };
    default:
      return {
        label: "Unverified",
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
        tooltip: "This asset is not verified. Please use with caution.",
      };
  }
}

function findCoinData(
  coins: CoinDescription[],
  assetType: string,
): CoinDescription | undefined {
  return coins.find(
    (coin) => coin.tokenAddress === assetType || coin.faAddress === assetType,
  );
}

function AssetIconFallback({ symbol }: { symbol: string }) {
  const text = symbol ? symbol.slice(0, 2).toUpperCase() : "";
  return (
    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
      {text ? text : <Coins className="h-4 w-4" />}
    </div>
  );
}

function CoinAssetIcon({
  logoUrl,
  symbol,
}: {
  logoUrl: string | null;
  symbol: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={symbol || "Coin"}
        className="h-6 w-6 rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return <AssetIconFallback symbol={symbol} />;
}

function FaAssetIcon({
  address,
  fallbackLogoUrl,
  symbol,
}: {
  address: string;
  fallbackLogoUrl: string | null;
  symbol: string;
}) {
  const { data } = useGetFaMetadata(address);
  const iconUrl = data?.icon_uri || fallbackLogoUrl;

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={symbol || "FA"}
        className="h-6 w-6 rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return <AssetIconFallback symbol={symbol} />;
}

export default function CoinsTab({ address }: { address: string }) {
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
        const isMoveCoin =
          coin.asset_type_v2 === "0x1::aptos_coin::AptosCoin";
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
  }, [accountCoins, coinListData?.data]);

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!coins.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No coin holdings found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Coin Holdings ({filteredCoins.length})</CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Button
              variant="ghost"
              size="sm"
              className={
                filter === "verified"
                  ? "text-guild-green-500"
                  : "text-muted-foreground"
              }
              onClick={() => setFilter("verified")}
            >
              Verified
            </Button>
            <span className="text-muted-foreground/60">|</span>
            <Button
              variant="ghost"
              size="sm"
              className={
                filter === "recognized"
                  ? "text-guild-green-500"
                  : "text-muted-foreground"
              }
              onClick={() => setFilter("recognized")}
            >
              Recognized
            </Button>
            <span className="text-muted-foreground/60">|</span>
            <Button
              variant="ghost"
              size="sm"
              className={
                filter === "all"
                  ? "text-guild-green-500"
                  : "text-muted-foreground"
              }
              onClick={() => setFilter("all")}
            >
              All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <HeaderRow>
                <TableHead>Coin</TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="text-right">Standard</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">USD Price</TableHead>
                <TableHead className="text-right">USD Value</TableHead>
              </HeaderRow>
            </TableHeader>
            <TableBody>
              {filteredCoins.map((coin) => {
                const isStruct = coin.assetType.includes("::");
                const href = isStruct
                  ? `/coin/${encodeURIComponent(coin.assetType)}`
                  : `/fa/${encodeURIComponent(coin.assetType)}`;
                const assetTypeLabel =
                  coin.tokenStandard === "v1"
                    ? "Coin"
                    : coin.tokenStandard === "v2"
                      ? "Fungible Asset"
                      : coin.tokenStandard;
                const isFA = coin.tokenStandard === "v2";

                return (
                  <TableRow key={coin.assetType}>
                    <TableCell>
                      <Link
                        href={href}
                        className="text-primary hover:underline"
                      >
                        {coin.name} ({coin.symbol})
                      </Link>
                    </TableCell>
                    <TableCell>{assetTypeLabel}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        {isFA ? (
                          <FaAssetIcon
                            address={coin.assetType}
                            fallbackLogoUrl={coin.logoUrl}
                            symbol={coin.symbol}
                          />
                        ) : (
                          <CoinAssetIcon
                            logoUrl={coin.logoUrl}
                            symbol={coin.symbol}
                          />
                        )}
                        {coin.assetType.length > 50
                          ? `${coin.assetType.slice(0, 30)}...${coin.assetType.slice(
                              -15,
                            )}`
                          : coin.assetType}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const display = getVerificationDisplay(
                          coin.verification.level,
                          coin.verification.reason,
                        );
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={
                                    coin.verification.level ===
                                      VerifiedType.LABS_BANNED ||
                                    coin.verification.level ===
                                      VerifiedType.COMMUNITY_BANNED
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="inline-flex items-center gap-1"
                                >
                                  {display.icon}
                                  <span className="text-xs">
                                    {display.label}
                                  </span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  {display.tooltip}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right uppercase">
                      {coin.tokenStandard}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {coin.amount.toLocaleString("en-US", {
                        maximumFractionDigits: coin.decimals,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {coin.usdPrice !== null
                        ? coin.usdPrice.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {coin.usdValue !== null
                        ? coin.usdValue.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
