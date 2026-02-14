"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, CompactTabsList } from "@/components/ui/tabs";
import { useGetAccountResource } from "@/hooks/accounts/useGetAccountResource";
import { useGetCoinSupplyLimit } from "@/hooks/coins/useGetCoinSupplyLimit";
import { useGetCoinPairedFa } from "@/hooks/coins/useGetCoinPairedFa";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { useGetIsGraphqlClientSupported } from "@/hooks/common/useGraphqlClient";
import { isValidStruct, getAssetSymbol } from "@/utils";
import { Users, ArrowLeftRight } from "lucide-react";
import { AccountIcon } from "@/app/account/[address]/components/AccountIcon";
import { VerifiedAssetBadge } from "@/components/common/VerifiedAssetBadge";
import { HeaderCopyableAddress } from "@/components/common/HeaderCopyableAddress";

// Components
import { CoinData } from "../components/InfoTab";
import { CoinOverview } from "../components/CoinOverview";
import HoldersTab from "../components/HoldersTab";
import TransactionsTab from "../components/TransactionsTab";

function CoinContent() {
  const params = useParams();
  const router = useRouter();
  const struct = decodeURIComponent(params.struct as string);
  const tabSlug = params.tab as string[] | undefined;
  const isGraphqlSupported = useGetIsGraphqlClientSupported();
  const defaultTab = isGraphqlSupported ? "holders" : "";
  const initialTab = tabSlug && tabSlug[0] !== "info" ? tabSlug[0] : defaultTab;
  const [currentTab, setCurrentTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    const scrollY = window.scrollY;
    setCurrentTab(value);
    window.history.pushState(null, "", `/coin/${struct}/${value}`);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  useEffect(() => {
    // Redirect legacy /info URLs
    if (tabSlug && tabSlug[0] === "info") {
      router.replace(`/coin/${encodeURIComponent(struct)}${isGraphqlSupported ? "/holders" : ""}`);
    }
  }, [tabSlug, struct, router, isGraphqlSupported]);

  // Validate struct format
  if (!isValidStruct(struct)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-[1440px]">
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
    (coin) => coin.tokenAddress === struct || coin.faAddress === struct,
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-[1440px]">
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

  // Get display symbol
  const displaySymbol = getAssetSymbol(
    coinDescription?.panoraSymbol,
    coinDescription?.bridge,
    coinData?.data?.symbol,
  );

  // Update page title
  useEffect(() => {
    if (displaySymbol && struct) {
      document.title = `Coin ${displaySymbol} (${struct}) | Movement Explorer`;
    }
  }, [displaySymbol, struct]);

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
          {/* Icon - responsive sizes matching account page */}
          <div className="shrink-0 hidden sm:block">
            {coinDescription?.logoUrl ? (
              <img
                src={coinDescription.logoUrl}
                alt={coinData?.data?.name || "Coin"}
                className="w-16 h-16 rounded-full shadow-md"
              />
            ) : (
              <AccountIcon type="token" address={struct} size="lg" />
            )}
          </div>
          <div className="shrink-0 sm:hidden">
            {coinDescription?.logoUrl ? (
              <img
                src={coinDescription.logoUrl}
                alt={coinData?.data?.name || "Coin"}
                className="w-12 h-12 rounded-full shadow-md"
              />
            ) : (
              <AccountIcon type="token" address={struct} size="md" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-heading font-semibold">
                {isLoading ? (
                  <EnhancedSkeleton className="h-8 w-48" />
                ) : (
                  coinData?.data?.name || "Unknown Coin"
                )}
              </h1>
              {!isLoading && (
                <VerifiedAssetBadge
                  id={struct}
                  coinData={coinDescription}
                  symbol={displaySymbol}
                />
              )}
              {displaySymbol && !isLoading && (
                <Badge variant="secondary" className="text-xs">
                  {displaySymbol}
                </Badge>
              )}
            </div>
            {/* Address row */}
            <div className="flex items-center gap-2 flex-wrap">
              <HeaderCopyableAddress address={struct} />
            </div>
          </div>
        </div>

        {/* Overview Card */}
        <CoinOverview
          struct={struct}
          coinData={coinData}
          coinDescription={coinDescription}
          supplyInfo={supplyInfo}
          pairedFa={pairedFa}
          displaySymbol={displaySymbol}
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
              <HoldersTab struct={struct} coinData={coinData} />
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionsTab struct={struct} />
            </TabsContent>
          </Tabs>
        )}
      </PageContainer>
    </>
  );
}

export default function CoinPage() {
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
      <CoinContent />
    </Suspense>
  );
}
