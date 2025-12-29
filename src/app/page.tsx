"use client";

import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo } from "@/services/general";
import { getTransactions } from "@/services/transactions";
import { useGlobalStore } from "@/store/useGlobalStore";
import Link from "next/link";
import { Types } from "aptos";
import { SearchBar } from "@/components/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function formatNumber(num: number | string): string {
  return Number(num).toLocaleString();
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) / 1000);
  return date.toLocaleString();
}

function getTransactionStatus(tx: Types.Transaction): {
  success: boolean;
  label: string;
} {
  if ("success" in tx) {
    return { success: tx.success, label: tx.success ? "Success" : "Failed" };
  }
  return { success: true, label: "Success" };
}

function getSender(tx: Types.Transaction): string | null {
  if (tx.type === "user_transaction" && "sender" in tx) {
    return (tx as Types.UserTransaction).sender;
  }
  return null;
}

export default function HomePage() {
  const { aptos_client, network_value } = useGlobalStore();

  // Ledger Info (for stats)
  const { data: ledgerInfo, isLoading: ledgerLoading } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: 5000,
  });

  // Recent Transactions
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["recentTransactions", network_value],
    queryFn: () => getTransactions({ limit: 10 }, aptos_client),
    refetchInterval: 5000,
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Explorer</h1>
        <p className="text-muted-foreground mb-6">
          Explore blocks, transactions, and accounts on the Movement network.
        </p>

        {/* Search Bar */}
        <SearchBar />
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Block Height
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {ledgerLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold font-mono">
                {formatNumber(ledgerInfo?.block_height || 0)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ledger Version
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {ledgerLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold font-mono">
                {formatNumber(ledgerInfo?.ledger_version || 0)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chain ID
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {ledgerLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold font-mono">
                {ledgerInfo?.chain_id || "-"}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Epoch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {ledgerLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold font-mono">
                {formatNumber(ledgerInfo?.epoch || 0)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/blocks">View Blocks</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/transactions">View Transactions</Link>
        </Button>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Recent Transactions</CardTitle>
          <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/transactions">View all →</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Sender</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx: Types.Transaction) => {
                  const status = getTransactionStatus(tx);
                  const sender = getSender(tx);
                  const version = "version" in tx ? tx.version : null;
                  const timestamp = "timestamp" in tx ? tx.timestamp : null;

                  return (
                    <TableRow key={tx.hash}>
                      <TableCell className="font-mono">
                        {version && (
                          <Link
                            href={`/txn/${version}`}
                            className="text-primary hover:underline"
                          >
                            {version}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.success ? "success" : "error"}>
                          {status.success ? "✓ Success" : "✗ Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {tx.type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {timestamp ? formatTimestamp(timestamp) : "-"}
                      </TableCell>
                      <TableCell className="font-mono">
                        {sender ? (
                          <Link
                            href={`/account/${sender}`}
                            className="text-primary hover:underline"
                          >
                            {sender.slice(0, 8)}...{sender.slice(-6)}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
