"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useGetMostRecentBlocks } from "@/hooks/blocks/useGetMostRecentBlocks";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Types } from "aptos";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const BLOCKS_COUNT = 30;

function getAgeInSeconds(blockTimestamp: string): string {
  const blockTime = parseInt(blockTimestamp) / 1000; // microseconds to milliseconds
  const now = Date.now();
  const ageSeconds = Math.floor((now - blockTime) / 1000);
  return ageSeconds.toString();
}

function getTransactionCount(block: Types.Block): string {
  return (
    BigInt(block.last_version) -
    BigInt(block.first_version) +
    BigInt(1)
  ).toString();
}

function BlocksContent() {
  const searchParams = useSearchParams();
  const startParam = searchParams.get("start");
  const actualStart = startParam ? startParam : undefined;

  const { recentBlocks, isLoading } = useGetMostRecentBlocks(
    actualStart,
    BLOCKS_COUNT
  );

  return (
    <>
      <PageNavigation title="Blocks" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Latest Blocks</h1>

        <Card>
          <CardHeader>
            <CardTitle>Latest Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Block</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Hash</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">
                        First Version
                      </TableHead>
                      <TableHead className="text-right">Last Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBlocks.map((block: Types.Block) => (
                      <TableRow key={block.block_height}>
                        <TableCell>
                          <Link
                            href={`/block/${block.block_height}`}
                            className="text-primary hover:underline font-mono"
                          >
                            {block.block_height}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {getAgeInSeconds(block.block_timestamp)}s ago
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {block.block_hash.slice(0, 10)}...
                            {block.block_hash.slice(-8)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {getTransactionCount(block)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/txn/${block.first_version}`}
                            className="text-primary hover:underline font-mono"
                          >
                            {block.first_version}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/txn/${block.last_version}`}
                            className="text-primary hover:underline font-mono"
                          >
                            {block.last_version}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function BlocksPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Latest Blocks</h1>
          <Card>
            <CardHeader>
              <CardTitle>Recent Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <BlocksContent />
    </Suspense>
  );
}
