"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useGetAccountResources } from "@/hooks/accounts/useGetAccountResources";
import { useGetAccountTransactions } from "@/hooks/accounts/useGetAccountTransactions";
import { useGetAccountTokens } from "@/hooks/accounts/useGetAccountTokens";
import { Types } from "aptos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Image as ImageIcon } from "lucide-react";

function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) / 1000);
  return date.toLocaleString();
}

function getBalance(resources: Types.MoveResource[]): string | null {
  const coinStore = resources.find(
    (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
  );
  if (coinStore && "coin" in coinStore.data) {
    const data = coinStore.data as { coin: { value: string } };
    const value = BigInt(data.coin.value);
    return (Number(value) / 1e8).toFixed(8);
  }
  return null;
}

// Extract coin holdings from resources
function getCoinHoldings(
  resources: Types.MoveResource[]
): { coinType: string; balance: string }[] {
  const holdings: { coinType: string; balance: string }[] = [];
  const coinStorePrefix = "0x1::coin::CoinStore<";

  resources.forEach((resource) => {
    if (resource.type.startsWith(coinStorePrefix)) {
      // Extract coin type from CoinStore<CoinType>
      const coinType = resource.type.slice(
        coinStorePrefix.length,
        resource.type.length - 1
      );
      if ("coin" in resource.data) {
        const data = resource.data as { coin: { value: string } };
        holdings.push({
          coinType,
          balance: data.coin.value,
        });
      }
    }
  });

  return holdings;
}

export default function AccountDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const {
    data: resources,
    isLoading: resourcesLoading,
    error: resourcesError,
  } = useGetAccountResources(address);

  const { data: transactions, isLoading: transactionsLoading } =
    useGetAccountTransactions(address, undefined, 25);

  const { data: tokens, isLoading: tokensLoading } = useGetAccountTokens(
    address,
    25
  );

  const isLoading = resourcesLoading;
  const balance = resources ? getBalance(resources) : null;
  const coinHoldings = resources ? getCoinHoldings(resources) : [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (resourcesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load account {address}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">Account</h1>

      {/* Account Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-mono text-sm break-all">{address}</p>
            </div>
            {balance && (
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="font-mono text-xl font-semibold">
                  {balance} MOVE
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="coins">Coins ({coinHoldings.length})</TabsTrigger>
          <TabsTrigger value="tokens">NFTs ({tokens.length})</TabsTrigger>
          <TabsTrigger value="resources">
            Resources ({resources?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx: Types.Transaction) => {
                        const version = "version" in tx ? tx.version : null;
                        const timestamp =
                          "timestamp" in tx ? tx.timestamp : null;
                        return (
                          <TableRow key={tx.hash}>
                            <TableCell>
                              {version && (
                                <Link
                                  href={`/txn/${version}`}
                                  className="text-primary hover:underline font-mono text-sm"
                                >
                                  {version}
                                </Link>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {tx.type.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {timestamp ? formatTimestamp(timestamp) : "-"}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/txn/${tx.hash}`}
                                className="text-primary hover:underline font-mono text-sm"
                              >
                                {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No transactions found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coins Tab */}
        <TabsContent value="coins">
          <Card>
            <CardHeader>
              <CardTitle>Coin Holdings ({coinHoldings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {coinHoldings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coin Type</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coinHoldings.map((holding, i) => {
                        const balanceNum =
                          Number(BigInt(holding.balance)) / 1e8;
                        return (
                          <TableRow key={i}>
                            <TableCell>
                              <Link
                                href={`/coin/${encodeURIComponent(
                                  holding.coinType
                                )}`}
                                className="text-primary hover:underline font-mono text-sm flex items-center gap-2"
                              >
                                <Coins className="h-4 w-4" />
                                {holding.coinType.length > 50
                                  ? `${holding.coinType.slice(
                                      0,
                                      30
                                    )}...${holding.coinType.slice(-15)}`
                                  : holding.coinType}
                              </Link>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {balanceNum.toLocaleString("en-US", {
                                maximumFractionDigits: 8,
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No coin holdings found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tokens (NFTs) Tab */}
        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>NFTs ({tokens.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {tokensLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : tokens.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Collection</TableHead>
                        <TableHead>Standard</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokens.map((token) => (
                        <TableRow key={token.token_data_id}>
                          <TableCell>
                            <Link
                              href={`/token/${encodeURIComponent(
                                token.token_data_id
                              )}`}
                              className="text-primary hover:underline flex items-center gap-2"
                            >
                              <ImageIcon className="h-4 w-4" />
                              {token.current_token_data?.token_name ||
                                token.token_data_id.slice(0, 20) + "..."}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {token.current_token_data?.current_collection
                              ?.collection_name || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {token.token_standard}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {token.amount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No NFTs found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resources ({resources?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {resources && resources.length > 0 ? (
                <div className="space-y-4">
                  {resources.map((resource, i) => (
                    <div
                      key={i}
                      className="border border-border rounded-lg p-4"
                    >
                      <p className="text-sm text-muted-foreground mb-2 font-mono break-all">
                        {resource.type}
                      </p>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(resource.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No resources found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Module viewer coming soon. Check the Resources tab for now.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
