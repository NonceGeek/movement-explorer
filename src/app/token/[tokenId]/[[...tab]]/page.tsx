"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetTokenData } from "@/hooks/tokens/useGetTokenData";
import { FileText, BarChart2, Activity } from "lucide-react";
import { TokenHeader } from "../components/TokenHeader";
import { TokenBasicInfoCard } from "../components/TokenBasicInfoCard";
import { CollectionInfoCard } from "../components/CollectionInfoCard";
import { TokenDetailInfoCard } from "../components/TokenDetailInfoCard";
import { TokenDescriptionCard } from "../components/TokenDescriptionCard";
import { ActivitiesTab } from "../components/ActivitiesTab";

function TokenContent() {
  const params = useParams();
  const tokenId = decodeURIComponent(params.tokenId as string);
  const tabSlug = params.tab as string[] | undefined;
  const initialTab = tabSlug ? tabSlug[0] : "overview";

  const [currentTab, setCurrentTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    const scrollY = window.scrollY;
    setCurrentTab(value);
    window.history.pushState(null, "", `/token/${tokenId}/${value}`);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };


  const { data, isLoading, error } = useGetTokenData(tokenId);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading token</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tokenDatas = data ?? [];
  const token = tokenDatas[0];

  if (!isLoading && tokenDatas.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Token not found</p>
            <p className="text-sm text-muted-foreground mt-2 font-mono">
              {tokenId}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageNavigation />
      <PageContainer>
        <TokenHeader
          isLoading={isLoading}
          tokenName={token?.token_name}
          tokenId={tokenId}
          tokenUri={token?.token_uri}
          collectionName={token?.current_collection?.collection_name}
        />

        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList variant="line">
            <TabsTrigger
              value="overview"
              variant="line"
              className="flex items-center gap-2"
            >
              <BarChart2 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              variant="line"
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <EnhancedSkeleton className="h-5 w-24" />
                      <EnhancedSkeleton className="h-5 w-48" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : token ? (
              <div className="space-y-6">
                {/* Row 1: Basic Info + Collection Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TokenBasicInfoCard token={token} tokenId={tokenId} />
                  <CollectionInfoCard collection={token.current_collection} />
                </div>

                {/* Row 2: Detail Info (IDs, Supply, Maximum, Properties, Last Tx) */}
                <TokenDetailInfoCard token={token} />

                {/* Row 3: Token Description */}
                {token.description && (
                  <TokenDescriptionCard description={token.description} />
                )}
              </div>
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-6 mb-6">
            <EnhancedSkeleton className="w-24 h-24 rounded-lg" />
            <div>
              <EnhancedSkeleton className="h-9 w-48 mb-2" />
              <EnhancedSkeleton className="h-5 w-64" />
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <EnhancedSkeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      }
    >
      <TokenContent />
    </Suspense>
  );
}
