"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Types } from "aptos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) / 1000);
  return date.toLocaleString();
}

function getGasInfo(
  tx: Types.Transaction
): { gasUsed: string; gasPrice: string; gasFee: string } | null {
  if ("gas_used" in tx && "gas_unit_price" in tx) {
    const gasUsed = tx.gas_used;
    const gasPrice = tx.gas_unit_price;
    const gasFee = (BigInt(gasUsed) * BigInt(gasPrice)).toString();
    return { gasUsed, gasPrice, gasFee };
  }
  return null;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const hash = params.hash as string;

  const { data: tx, isLoading, error } = useGetTransaction(hash);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Failed to load transaction {hash}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuccess = "success" in tx ? tx.success : true;
  const version = "version" in tx ? tx.version : null;
  const timestamp = "timestamp" in tx ? tx.timestamp : null;
  const sender = "sender" in tx ? (tx as Types.UserTransaction).sender : null;
  const gasInfo = getGasInfo(tx);
  const payload =
    "payload" in tx ? (tx as Types.UserTransaction).payload : null;
  const events = "events" in tx ? tx.events : [];
  const changes = "changes" in tx ? tx.changes : [];

  return (
    <>
      <PageNavigation title="Transaction Details" />
      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Transaction Details</h1>
          <Badge variant={isSuccess ? "success" : "error"}>
            {isSuccess ? "✓ Success" : "✗ Failed"}
          </Badge>
        </div>

        {/* Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {version && (
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-mono">{version}</p>
                </div>
              )}
              {timestamp && (
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-mono">{formatTimestamp(timestamp)}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Hash</p>
                <p className="font-mono text-sm break-all">{tx.hash}</p>
              </div>
              {sender && (
                <div>
                  <p className="text-sm text-muted-foreground">Sender</p>
                  <Link
                    href={`/account/${sender}`}
                    className="font-mono text-primary hover:underline text-sm break-all"
                  >
                    {sender}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="secondary" className="capitalize">
                  {tx.type.replace(/_/g, " ")}
                </Badge>
              </div>
              {gasInfo && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Gas Used</p>
                    <p className="font-mono">{gasInfo.gasUsed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gas Fee</p>
                    <p className="font-mono">
                      {(Number(gasInfo.gasFee) / 1e8).toFixed(8)} MOVE
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payload">Payload</TabsTrigger>
            <TabsTrigger value="events">
              Events ({events?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="changes">
              Changes ({changes?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(
                    {
                      type: tx.type,
                      hash: tx.hash,
                      version,
                      timestamp,
                      sender,
                      success: isSuccess,
                      gas_used: gasInfo?.gasUsed,
                      gas_unit_price: gasInfo?.gasPrice,
                    },
                    null,
                    2
                  )}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payload">
            <Card>
              <CardHeader>
                <CardTitle>Payload</CardTitle>
              </CardHeader>
              <CardContent>
                {payload ? (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">No payload</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Events ({events?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {events && events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event, i) => (
                      <div
                        key={i}
                        className="border border-border rounded-lg p-4"
                      >
                        <p className="text-sm text-muted-foreground mb-2">
                          #{event.sequence_number} - {event.type}
                        </p>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No events</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="changes">
            <Card>
              <CardHeader>
                <CardTitle>Changes ({changes?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {changes && changes.length > 0 ? (
                  <div className="space-y-4">
                    {changes.slice(0, 20).map((change, i) => (
                      <div
                        key={i}
                        className="border border-border rounded-lg p-4"
                      >
                        <p className="text-sm text-muted-foreground mb-2">
                          {change.type}
                        </p>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(change, null, 2)}
                        </pre>
                      </div>
                    ))}
                    {changes.length > 20 && (
                      <p className="text-muted-foreground text-sm">
                        Showing first 20 of {changes.length} changes
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No changes</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
