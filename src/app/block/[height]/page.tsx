"use client";

import { useGetBlockByHeight } from "@/hooks/blocks/useGetBlock";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) / 1000);
  return date.toLocaleString();
}

export default function BlockDetailPage() {
  const params = useParams();
  const height = parseInt(params.height as string);

  const {
    data: block,
    isLoading,
    error,
  } = useGetBlockByHeight({
    height,
    withTransactions: true,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load block {height}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const transactionCount =
    BigInt(block.last_version) - BigInt(block.first_version) + BigInt(1);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="flex items-center gap-2 mb-6">
        {height > 0 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/block/${height - 1}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/block/${height + 1}`}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">Block #{height}</h1>

      {/* Block Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Block Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Block Height</p>
              <p className="font-mono text-lg">{block.block_height}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timestamp</p>
              <p className="font-mono">
                {formatTimestamp(block.block_timestamp)}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Block Hash</p>
              <p className="font-mono text-sm break-all">{block.block_hash}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">First Version</p>
              <Link
                href={`/txn/${block.first_version}`}
                className="font-mono text-primary hover:underline"
              >
                {block.first_version}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Version</p>
              <Link
                href={`/txn/${block.last_version}`}
                className="font-mono text-primary hover:underline"
              >
                {block.last_version}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="font-mono">{transactionCount.toString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions in Block */}
      {block.transactions && block.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Transactions in this Block ({block.transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {block.transactions.slice(0, 25).map((tx) => {
                    const version = "version" in tx ? tx.version : null;
                    return (
                      <TableRow key={tx.hash}>
                        <TableCell>
                          {version && (
                            <Link
                              href={`/txn/${version}`}
                              className="text-primary hover:underline font-mono"
                            >
                              {version}
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{tx.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <Link
                            href={`/txn/${tx.hash}`}
                            className="text-primary hover:underline"
                          >
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {block.transactions.length > 25 && (
              <p className="text-muted-foreground text-sm mt-4">
                Showing first 25 transactions.{" "}
                <Link
                  href={`/transactions?block=${height}`}
                  className="text-primary hover:underline"
                >
                  View all
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
