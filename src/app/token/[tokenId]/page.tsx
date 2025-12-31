"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetTokenData } from "@/hooks/tokens/useGetTokenData";
import { ExternalLink, Image as ImageIcon, FileText } from "lucide-react";

function TokenContent() {
  const params = useParams();
  const tokenId = decodeURIComponent(params.tokenId as string);

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-6 mb-6">
          {/* Token Image */}
          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : token?.token_uri ? (
              <img
                src={token.token_uri}
                alt={token?.token_name || "Token"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const icon = document.createElement("div");
                    icon.innerHTML =
                      '<svg class="w-8 h-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    parent.appendChild(icon.firstChild as Node);
                  }
                }}
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                token?.token_name || "Unknown Token"
              )}
            </h1>
            {token?.current_collection && (
              <p className="text-muted-foreground mt-1">
                Collection: {token.current_collection.collection_name}
              </p>
            )}
            <p className="text-muted-foreground font-mono text-xs mt-2 truncate max-w-lg">
              {tokenId}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : token ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Token Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Token Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Name */}
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{token.token_name}</span>
                    </div>

                    {/* Token Standard */}
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Standard</span>
                      <Badge variant="secondary">{token.token_standard}</Badge>
                    </div>

                    {/* Token ID */}
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Token ID</span>
                      <span className="font-mono text-xs truncate max-w-[200px]">
                        {token.token_data_id}
                      </span>
                    </div>

                    {/* Supply */}
                    {token.supply !== null && (
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Supply</span>
                        <span className="font-mono">{token.supply}</span>
                      </div>
                    )}

                    {/* Fungible */}
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Fungible</span>
                      <Badge
                        variant={token.is_fungible_v2 ? "default" : "secondary"}
                      >
                        {token.is_fungible_v2 ? "Yes" : "No"}
                      </Badge>
                    </div>

                    {/* Token URI */}
                    {token.token_uri && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Token URI</span>
                        <a
                          href={token.token_uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm truncate max-w-[200px]"
                        >
                          View
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Collection Info */}
                {token.current_collection && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Collection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Collection Name */}
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">
                          {token.current_collection.collection_name}
                        </span>
                      </div>

                      {/* Creator */}
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Creator</span>
                        <Link
                          href={`/account/${token.current_collection.creator_address}`}
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {token.current_collection.creator_address.slice(0, 8)}
                          ...
                          {token.current_collection.creator_address.slice(-6)}
                        </Link>
                      </div>

                      {/* Description */}
                      {token.current_collection.description && (
                        <div className="py-2 border-b">
                          <span className="text-muted-foreground block mb-2">
                            Description
                          </span>
                          <p className="text-sm">
                            {token.current_collection.description}
                          </p>
                        </div>
                      )}

                      {/* Collection URI */}
                      {token.current_collection.uri && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-muted-foreground">URI</span>
                          <a
                            href={token.current_collection.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Token Description */}
                {token.description && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{token.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Token Properties */}
                {token.token_properties &&
                  Object.keys(token.token_properties).length > 0 && (
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Properties</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {Object.entries(token.token_properties).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="p-3 bg-muted rounded-lg"
                              >
                                <p className="text-xs text-muted-foreground uppercase">
                                  {key}
                                </p>
                                <p className="font-medium truncate">
                                  {String(value)}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default function TokenPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-6 mb-6">
            <Skeleton className="w-24 h-24 rounded-lg" />
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
