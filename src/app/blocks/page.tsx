"use client";

import { useGetMostRecentBlocks } from "@/hooks/blocks/useGetMostRecentBlocks";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Types } from "aptos";
import { Suspense } from "react";

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
  const start = searchParams.get("start") ?? undefined;
  const { recentBlocks, isLoading } = useGetMostRecentBlocks(
    start,
    BLOCKS_COUNT
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Latest Blocks</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold">Block</th>
                <th className="text-left p-4 font-semibold">Age</th>
                <th className="text-left p-4 font-semibold">Hash</th>
                <th className="text-right p-4 font-semibold">Transactions</th>
                <th className="text-right p-4 font-semibold">First Version</th>
                <th className="text-right p-4 font-semibold">Last Version</th>
              </tr>
            </thead>
            <tbody>
              {recentBlocks.map((block: Types.Block) => (
                <tr
                  key={block.block_height}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4">
                    <Link
                      href={`/block/${block.block_height}`}
                      className="text-primary hover:underline font-mono"
                    >
                      {block.block_height}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {getAgeInSeconds(block.block_timestamp)}s ago
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm">
                      {block.block_hash.slice(0, 10)}...
                      {block.block_hash.slice(-8)}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono">
                    {getTransactionCount(block)}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/txn/${block.first_version}`}
                      className="text-primary hover:underline font-mono"
                    >
                      {block.first_version}
                    </Link>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/txn/${block.last_version}`}
                      className="text-primary hover:underline font-mono"
                    >
                      {block.last_version}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function BlocksPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Latest Blocks</h1>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <BlocksContent />
    </Suspense>
  );
}
