"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetFaMetadata } from "@/hooks/coins/useGetFaMetadata";
import { useGetFASupply } from "@/hooks/coins/useGetFASupply";
import { useGetFaPairedCoin } from "@/hooks/coins/useGetFaPairedCoin";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { isValidAccountAddress } from "@/utils";
import { formatMoveAmount } from "@/utils/transaction";
import { ExternalLink, Coins, Image as ImageIcon } from "lucide-react";

function FAContent() {
  const params = useParams();
  const address = params.address as string;

  // Validate address format
  if (!isValidAccountAddress(address)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Invalid address format: {address}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch FA metadata
  const { data: metadata, isLoading: isLoadingMetadata } =
    useGetFaMetadata(address);

  // Fetch supply
  const { data: supply, isLoading: isLoadingSupply } = useGetFASupply(address);

  // Fetch paired coin
  const { data: pairedCoin, isLoading: isLoadingPairedCoin } =
    useGetFaPairedCoin(address);

  // Fetch coin list for additional info
  const { data: coinList } = useGetCoinList();

  const isLoading = isLoadingMetadata || isLoadingSupply || isLoadingPairedCoin;

  // Find coin description
  const coinDescription = coinList?.data?.find(
    (coin) => coin.faAddress === address || coin.tokenAddress === address
  );

  return (
    <>
      <PageNavigation title="Fungible Asset" />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {metadata?.icon_uri ? (
            <img
              src={metadata.icon_uri}
              alt={metadata?.name || "FA"}
              className="w-12 h-12 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : coinDescription?.logoUrl ? (
            <img
              src={coinDescription.logoUrl}
              alt={metadata?.name || "FA"}
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
                metadata?.name || "Unknown Fungible Asset"
              )}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">{address}</p>
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
            ) : metadata ? (
              <Card>
                <CardHeader>
                  <CardTitle>Fungible Asset Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{metadata.name}</span>
                  </div>

                  {/* Symbol */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Symbol</span>
                    <Badge variant="secondary">{metadata.symbol}</Badge>
                  </div>

                  {/* Decimals */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Decimals</span>
                    <span className="font-mono">{metadata.decimals}</span>
                  </div>

                  {/* Total Supply */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Total Supply</span>
                    <span className="font-mono">
                      {supply !== null
                        ? `${formatMoveAmount(supply)} ${metadata.symbol}`
                        : "Not tracked"}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Address</span>
                    <Link
                      href={`/account/${address}`}
                      className="text-primary hover:underline font-mono text-sm"
                    >
                      {address.slice(0, 10)}...{address.slice(-8)}
                    </Link>
                  </div>

                  {/* Paired Coin */}
                  {pairedCoin && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Paired Coin</span>
                      <Link
                        href={`/coin/${encodeURIComponent(pairedCoin)}`}
                        className="text-primary hover:underline font-mono text-sm flex items-center gap-1"
                      >
                        {pairedCoin.length > 40
                          ? `${pairedCoin.slice(0, 20)}...${pairedCoin.slice(
                              -10
                            )}`
                          : pairedCoin}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  {/* Icon */}
                  {metadata.icon_uri && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Icon</span>
                      <div className="flex items-center gap-2">
                        <img
                          src={metadata.icon_uri}
                          alt={metadata.name}
                          className="w-16 h-16 rounded"
                          onError={(e) => {
                            const parent = (e.target as HTMLImageElement)
                              .parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<span class="text-muted-foreground">Failed to load</span>';
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Project URI */}
                  {metadata.project_uri && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Project URL</span>
                      <a
                        href={metadata.project_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {metadata.project_uri}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    No fungible asset data found
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default function FAPage() {
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
      <FAContent />
    </Suspense>
  );
}
