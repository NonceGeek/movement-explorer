"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, CompactTabsList } from "@/components/ui/tabs";
import { useGetFaMetadata } from "@/hooks/coins/useGetFaMetadata";
import { useGetFASupply } from "@/hooks/coins/useGetFASupply";
import { useGetFaPairedCoin } from "@/hooks/coins/useGetFaPairedCoin";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { useGetIsGraphqlClientSupported } from "@/hooks/common/useGraphqlClient";
import { isValidAccountAddress, getAssetSymbol } from "@/utils";
import { Coins, Users, ArrowLeftRight, Copy, Check } from "lucide-react";
import { VerifiedAssetBadge } from "@/components/common/VerifiedAssetBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/styling";

import { FAOverview } from "../components/FAOverview";
import HoldersTab from "../components/HoldersTab";
import TransactionsTab from "../components/TransactionsTab";

function FAContent() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const tabSlug = params.tab as string[] | undefined;
  const isGraphqlSupported = useGetIsGraphqlClientSupported();
  const defaultTab = isGraphqlSupported ? "holders" : "";
  const initialTab = tabSlug && tabSlug[0] !== "info" ? tabSlug[0] : defaultTab;
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [copied, setCopied] = useState(false);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    router.push(`/fa/${address}/${value}`);
  };

  useEffect(() => {
    // Redirect legacy /info URLs
    if (tabSlug && tabSlug[0] === "info") {
      router.replace(`/fa/${address}${isGraphqlSupported ? "/holders" : ""}`);
      return;
    }
    if (tabSlug && tabSlug[0] !== currentTab) {
      setCurrentTab(tabSlug[0]);
    }
  }, [tabSlug, address, router, isGraphqlSupported]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Validate address format
  if (!isValidAccountAddress(address)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-[1440px]">
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
    (coin) => coin.faAddress === address || coin.tokenAddress === address,
  );

  const displaySymbol = getAssetSymbol(
    coinDescription?.panoraSymbol,
    coinDescription?.bridge,
    metadata?.symbol,
  );

  useEffect(() => {
    if (displaySymbol && address) {
      document.title = `Fungible Asset ${displaySymbol} (${address}) | Movement Explorer`;
    }
  }, [displaySymbol, address]);

  // Build tab items (only when GraphQL is supported)
  const tabItems = isGraphqlSupported
    ? [
        {
          value: "holders",
          label: "Holders",
          icon: <Users className="h-4 w-4 mr-1" />,
        },
        {
          value: "transactions",
          label: "Transactions",
          icon: <ArrowLeftRight className="h-4 w-4 mr-1" />,
        },
      ]
    : [];

  return (
    <>
      <PageNavigation />
      <PageContainer>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {metadata?.icon_uri || coinDescription?.logoUrl ? (
            <img
              src={metadata?.icon_uri || coinDescription?.logoUrl}
              alt={metadata?.name || "FA"}
              className="w-14 h-14 rounded-full shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Coins className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-bold">
                {isLoading ? (
                  <EnhancedSkeleton className="h-9 w-48" />
                ) : (
                  metadata?.name || "Unknown Fungible Asset"
                )}
              </h1>
              {!isLoading && (
                <VerifiedAssetBadge
                  id={address}
                  coinData={coinDescription}
                  symbol={displaySymbol}
                />
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyAddress}
                      className="inline-flex items-center gap-1.5 bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-md transition-colors group"
                    >
                      <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground truncate max-w-[300px]">
                        {address}
                      </span>
                      <span className="relative h-4 w-4 shrink-0">
                        <Copy
                          className={cn(
                            "absolute inset-0 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all duration-200",
                            copied
                              ? "scale-0 opacity-0"
                              : "scale-100 opacity-100",
                          )}
                        />
                        <Check
                          className={cn(
                            "absolute inset-0 h-4 w-4 text-guild-green-500 transition-all duration-200",
                            copied
                              ? "scale-100 opacity-100"
                              : "scale-0 opacity-0",
                          )}
                        />
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{copied ? "Copied!" : "Click to copy"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {displaySymbol && !isLoading && (
                <Badge
                  variant="secondary"
                  className="font-mono text-sm px-3 py-1.5"
                >
                  {displaySymbol}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Overview Card */}
        <FAOverview
          address={address}
          metadata={metadata}
          supply={supply}
          pairedCoin={pairedCoin ?? undefined}
          coinDescription={coinDescription}
          displaySymbol={displaySymbol}
          isLoading={isLoading}
        />

        {/* Tabs (only when GraphQL is supported) */}
        {isGraphqlSupported && tabItems.length > 0 && (
          <Tabs
            value={currentTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <CompactTabsList
              items={tabItems}
              activeTab={currentTab}
              onTabChange={handleTabChange}
            />

            <TabsContent value="holders">
              <HoldersTab
                address={address}
                metadata={metadata}
                coinDescription={coinDescription}
                displaySymbol={displaySymbol}
              />
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionsTab address={address} />
            </TabsContent>
          </Tabs>
        )}
      </PageContainer>
    </>
  );
}

export default function FAPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <EnhancedSkeleton className="w-12 h-12 rounded-full" />
            <div>
              <EnhancedSkeleton className="h-9 w-48 mb-2" />
              <EnhancedSkeleton className="h-5 w-64" />
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <EnhancedSkeleton key={i} className="h-12 w-full" />
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
