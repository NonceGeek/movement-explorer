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
import { useGetMovementTokenPrices } from "@/hooks/coins/useGetMovementTokenPrices";
import { useGetIsGraphqlClientSupported } from "@/hooks/common/useGraphqlClient";
import { isValidAccountAddress, getAssetSymbol } from "@/utils";
import { Users, ArrowLeftRight } from "lucide-react";
import { AccountIcon } from "@/app/account/[address]/components/AccountIcon";
import { VerifiedAssetBadge } from "@/components/common/VerifiedAssetBadge";
import { HeaderCopyableAddress } from "@/components/common/HeaderCopyableAddress";

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
  const handleTabChange = (value: string) => {
    const scrollY = window.scrollY;
    setCurrentTab(value);
    window.history.pushState(null, "", `/fa/${address}/${value}`);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  useEffect(() => {
    // Redirect legacy /info URLs
    if (tabSlug && tabSlug[0] === "info") {
      router.replace(`/fa/${address}${isGraphqlSupported ? "/holders" : ""}`);
    }
  }, [tabSlug, address, router, isGraphqlSupported]);

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
  const { data: tokenPrices = {} } = useGetMovementTokenPrices([address]);

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
  const onchainUsdPrice = tokenPrices[address.toLowerCase()];
  const usdPrice =
    onchainUsdPrice !== undefined
      ? String(onchainUsdPrice)
      : coinDescription?.usdPrice;

  useEffect(() => {
    if (displaySymbol && address) {
      document.title = `Fungible Asset ${displaySymbol} (${address}) | Movement Explorer`;
    }
  }, [displaySymbol, address]);

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
        <div className="flex items-start gap-3 sm:items-center sm:gap-4 mb-6">
          <div className="shrink-0 hidden sm:block">
            {metadata?.icon_uri || coinDescription?.logoUrl ? (
              <img
                src={metadata?.icon_uri || coinDescription?.logoUrl}
                alt={metadata?.name || "FA"}
                className="w-16 h-16 rounded-full shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <AccountIcon type="token" address={address} size="lg" />
            )}
          </div>
          <div className="shrink-0 sm:hidden">
            {metadata?.icon_uri || coinDescription?.logoUrl ? (
              <img
                src={metadata?.icon_uri || coinDescription?.logoUrl}
                alt={metadata?.name || "FA"}
                className="w-12 h-12 rounded-full shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <AccountIcon type="token" address={address} size="md" />
            )}
          </div>
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
              <HeaderCopyableAddress address={address} />

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
          usdPrice={usdPrice}
          isLoading={isLoading}
        />

        {/* Tabs (only when GraphQL is supported) */}
        {isGraphqlSupported && tabItems.length > 0 && (
          <Tabs
            value={currentTab}
            onValueChange={handleTabChange}
            className="space-y-3"
          >
            <CompactTabsList
              items={tabItems}
              activeTab={currentTab}
              onTabChange={handleTabChange}
            />

            <TabsContent value="holders">
              {isLoadingPairedCoin ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <EnhancedSkeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <HoldersTab
                  address={pairedCoin ?? address}
                  metadata={metadata}
                  coinDescription={coinDescription}
                  displaySymbol={displaySymbol}
                />
              )}
            </TabsContent>

            <TabsContent value="transactions">
              {isLoadingPairedCoin ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <EnhancedSkeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <TransactionsTab address={pairedCoin ?? address} />
              )}
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
