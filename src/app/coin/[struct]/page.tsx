"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetAccountResource } from "@/hooks/accounts/useGetAccountResource";
import {
  useGetCoinSupplyLimit,
  SupplyType,
} from "@/hooks/coins/useGetCoinSupplyLimit";
import { useGetCoinPairedFa } from "@/hooks/coins/useGetCoinPairedFa";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { isValidStruct } from "@/utils";
import { formatMoveAmount } from "@/utils/transaction";
import { CheckCircle2, HelpCircle, ExternalLink, Coins } from "lucide-react";

interface CoinData {
  type: string;
  data: {
    decimals: number;
    name: string;
    symbol: string;
    supply?: {
      vec: [
        {
          aggregator?: { vec: [{ handle: string; key: string }] };
          integer?: { vec: [{ limit: string; value: string }] };
        }
      ];
    };
  };
}

function CoinContent() {
  const params = useParams();
  const struct = decodeURIComponent(params.struct as string);

  // Validate struct format
  if (!isValidStruct(struct)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Invalid coin format: {struct}</p>
            <p className="text-muted-foreground mt-2">
              Expected format: 0x...::module::CoinType
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const address = struct.split("::")[0];

  // Fetch coin info
  const {
    data: coinInfo,
    isLoading: isLoadingInfo,
    error,
  } = useGetAccountResource(address, `0x1::coin::CoinInfo<${struct}>`);

  // Fetch supply info
  const { isLoading: isLoadingSupply, data: supplyInfo } =
    useGetCoinSupplyLimit(struct);

  // Fetch paired FA
  const { isLoading: isLoadingPairedFa, data: pairedFa } =
    useGetCoinPairedFa(struct);

  // Fetch coin list for additional info
  const { data: coinList } = useGetCoinList();

  const isLoading = isLoadingInfo || isLoadingSupply || isLoadingPairedFa;

  // Find coin in list
  const coinDescription = coinList?.data?.find(
    (coin) => coin.tokenAddress === struct || coin.faAddress === struct
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Error loading coin: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coinData = coinInfo as CoinData | undefined;
  const [supply, supplyType] = supplyInfo;

  return (
    <>
      <PageNavigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {coinDescription?.logoUrl ? (
            <img
              src={coinDescription.logoUrl}
              alt={coinData?.data?.name || "Coin"}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Coins className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                coinData?.data?.name || "Unknown Coin"
              )}
            </h1>
            <p className="text-muted-foreground font-mono text-sm truncate max-w-md">
              {struct}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : coinData ? (
              <Card>
                <CardHeader>
                  <CardTitle>Coin Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{coinData.data.name}</span>
                  </div>

                  {/* Symbol */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Symbol</span>
                    <Badge variant="secondary">{coinData.data.symbol}</Badge>
                  </div>

                  {/* Decimals */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Decimals</span>
                    <span className="font-mono">{coinData.data.decimals}</span>
                  </div>

                  {/* Total Supply */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Total Supply</span>
                    <div className="flex items-center gap-2">
                      {supply !== null ? (
                        <>
                          <span className="font-mono">
                            {formatMoveAmount(supply)} {coinData.data.symbol}
                          </span>
                          {supplyType === SupplyType.ON_CHAIN && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {supplyType === SupplyType.NO_SUPPLY_TRACKED && (
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Not tracked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Creator */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Creator</span>
                    <Link
                      href={`/account/${address}`}
                      className="text-primary hover:underline font-mono text-sm"
                    >
                      {address.slice(0, 10)}...{address.slice(-8)}
                    </Link>
                  </div>

                  {/* Paired FA */}
                  {pairedFa && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">
                        Paired Fungible Asset
                      </span>
                      <Link
                        href={`/fa/${pairedFa}`}
                        className="text-primary hover:underline font-mono text-sm flex items-center gap-1"
                      >
                        {pairedFa.slice(0, 10)}...{pairedFa.slice(-8)}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  {/* Icon */}
                  {coinDescription?.logoUrl && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Icon</span>
                      <img
                        src={coinDescription.logoUrl}
                        alt={coinData.data.name}
                        className="w-16 h-16 rounded"
                      />
                    </div>
                  )}

                  {/* Website */}
                  {coinDescription?.websiteUrl && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Website</span>
                      <a
                        href={coinDescription.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {coinDescription.websiteUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No coin data found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default function CoinPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      }
    >
      <CoinContent />
    </Suspense>
  );
}
