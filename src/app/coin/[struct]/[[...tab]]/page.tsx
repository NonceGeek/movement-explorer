"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, ResponsiveTabsList } from "@/components/ui/tabs";
import { useGetAccountResource } from "@/hooks/accounts/useGetAccountResource";
import { useGetCoinSupplyLimit } from "@/hooks/coins/useGetCoinSupplyLimit";
import { useGetCoinPairedFa } from "@/hooks/coins/useGetCoinPairedFa";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { useGetIsGraphqlClientSupported } from "@/hooks/common/useGraphqlClient";
import { isValidStruct, getAssetSymbol } from "@/utils";
import { Coins, Info, Users, ArrowLeftRight, Copy, Check } from "lucide-react";
import { VerifiedAssetBadge } from "@/components/common/VerifiedAssetBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/styling";

// Tab Components
import InfoTab, { CoinData } from "../components/InfoTab";
import HoldersTab from "../components/HoldersTab";
import TransactionsTab from "../components/TransactionsTab";

function CoinContent() {
  const params = useParams();
  const router = useRouter();
  const struct = decodeURIComponent(params.struct as string);
  const tabSlug = params.tab as string[] | undefined;
  const initialTab = tabSlug ? tabSlug[0] : "info";
  const isGraphqlSupported = useGetIsGraphqlClientSupported();
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [copied, setCopied] = useState(false);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    router.push(`/coin/${struct}/${value}`);
  };

  useEffect(() => {
    if (tabSlug && tabSlug[0] !== currentTab) {
      setCurrentTab(tabSlug[0]);
    }
  }, [tabSlug]);

  const handleCopyStruct = async () => {
    try {
      await navigator.clipboard.writeText(struct);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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

  // Build tab items based on GraphQL support
  const tabItems = [
    {
      value: "info",
      label: "Info",
      icon: <Info className="h-4 w-4 mr-1" />,
    },
    ...(isGraphqlSupported
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
      : []),
  ];

  return (
    <>
      <PageNavigation title="Coin" />
      <PageContainer>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {coinDescription?.logoUrl ? (
            <img
              src={coinDescription.logoUrl}
              alt={coinData?.data?.name || "Coin"}
              className="w-14 h-14 rounded-full shrink-0"
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
            </div>

            {/* Struct and Symbol Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Struct Badge */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyStruct}
                      className="inline-flex items-center gap-1.5 bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-md transition-colors group"
                    >
                      <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground truncate max-w-[300px]">
                        {struct}
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

              {/* Symbol Badge */}
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

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <ResponsiveTabsList
            items={tabItems}
            activeTab={currentTab}
            onTabChange={handleTabChange}
          />

          <TabsContent value="info">
            <InfoTab
              struct={struct}
              coinData={coinData}
              coinDescription={coinDescription}
              supplyInfo={supplyInfo}
              pairedFa={pairedFa}
              isLoading={isLoading}
            />
          </TabsContent>

          {isGraphqlSupported && (
            <>
              <TabsContent value="holders">
                <HoldersTab struct={struct} coinData={coinData} />
              </TabsContent>

              <TabsContent value="transactions">
                <TransactionsTab struct={struct} />
              </TabsContent>
            </>
          )}
        </Tabs>
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
