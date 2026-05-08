"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, CompactTabsList } from "@/components/ui/tabs";
import { useGetTokenData } from "@/hooks/tokens/useGetTokenData";
import { BarChart2, Activity, Search } from "lucide-react";
import { TokenHeader } from "../components/TokenHeader";
import { TokenDetailsSection } from "../components/TokenDetailsSection";
import { ActivitiesTab } from "../components/ActivitiesTab";
import { DetailSection, DetailRow } from "@/app/txn/[hash]/components/DetailRow";

function TokenContent() {
  const params = useParams();
  const tokenId = decodeURIComponent(params.tokenId as string);
  const tabSlug = params.tab as string[] | undefined;
  const initialTab = tabSlug ? tabSlug[0] : "overview";

  const [currentTab, setCurrentTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    const scrollY = window.scrollY;
    setCurrentTab(value);
    window.history.pushState(null, "", `/token/${encodeURIComponent(tokenId)}/${value}`);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  const tabItems = [
    { value: "overview", label: "Overview", icon: <BarChart2 className="w-4 h-4" /> },
    { value: "activities", label: "Activities", icon: <Activity className="w-4 h-4" /> },
  ];

  const { data, isLoading, error } = useGetTokenData(tokenId);

  const tokenDatas = data ?? [];
  const token = tokenDatas[0];

  // Error State
  if (error && !isLoading) {
    return (
      <>
        <PageNavigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load token data</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Not Found State
  if (!isLoading && tokenDatas.length === 0) {
    return (
      <>
        <PageNavigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <Search className="w-16 h-16 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-semibold">Token Not Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  The token{" "}
                  <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {tokenId.length > 30 ? `${tokenId.slice(0, 30)}...` : tokenId}
                  </code>{" "}
                  could not be found on the current network.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check the token ID or try a different network.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageNavigation />
      <PageContainer>
        {/* Token Header */}
        <TokenHeader
          isLoading={isLoading}
          tokenName={token?.token_name}
          tokenId={tokenId}
          tokenUri={token?.token_uri}
          tokenStandard={token?.token_standard}
        />

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="space-y-3"
        >
          <CompactTabsList
            items={tabItems}
            activeTab={currentTab}
            onTabChange={setCurrentTab}
          />

          <TabsContent value="overview">
            {isLoading ? (
              <DetailSection>
                {Array.from({ length: 8 }).map((_, i) => (
                  <DetailRow key={i} label="" isLast={i === 7}>
                    <EnhancedSkeleton className="h-5 w-full max-w-md" />
                  </DetailRow>
                ))}
              </DetailSection>
            ) : token ? (
              <TokenDetailsSection token={token} tokenId={tokenId} />
            ) : null}
          </TabsContent>

          <TabsContent value="activities">
            <ActivitiesTab tokenId={tokenId} />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}

export default function TokenPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageNavigation />
          <div className="container mx-auto px-4 py-8">
            {/* Header Skeleton */}
            <div className="flex items-start gap-4 mb-6">
              <EnhancedSkeleton className="w-16 h-16 rounded-lg" />
              <div>
                <EnhancedSkeleton className="h-7 w-48 mb-2" />
                <EnhancedSkeleton className="h-5 w-64" />
              </div>
            </div>
            {/* Content Skeleton */}
            <div className="bg-card backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden px-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 py-3.5 ${i < 7 ? "border-b border-border/30" : ""}`}
                >
                  <EnhancedSkeleton className="h-5 w-24" />
                  <EnhancedSkeleton className="h-5 w-full max-w-md" />
                </div>
              ))}
            </div>
          </div>
        </>
      }
    >
      <TokenContent />
    </Suspense>
  );
}
