"use client";

import { useGetBlockByHeight } from "@/hooks/blocks/useGetBlock";
import { useParams } from "next/navigation";
import Link from "next/link";

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
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
          <h2 className="font-semibold">Error</h2>
          <p>Failed to load block {height}</p>
        </div>
      </div>
    );
  }

  const transactionCount =
    BigInt(block.last_version) - BigInt(block.first_version) + BigInt(1);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        {height > 0 && (
          <Link
            href={`/block/${height - 1}`}
            className="text-primary hover:underline"
          >
            ← Previous
          </Link>
        )}
        <Link
          href={`/block/${height + 1}`}
          className="text-primary hover:underline"
        >
          Next →
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">Block #{height}</h1>

      {/* Block Info Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
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
      </div>

      {/* Transactions in Block */}
      {block.transactions && block.transactions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Transactions in this Block ({block.transactions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Version</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Hash</th>
                </tr>
              </thead>
              <tbody>
                {block.transactions.slice(0, 25).map((tx) => {
                  const version = "version" in tx ? tx.version : null;
                  return (
                    <tr
                      key={tx.hash}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        {version && (
                          <Link
                            href={`/txn/${version}`}
                            className="text-primary hover:underline font-mono"
                          >
                            {version}
                          </Link>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-1 text-xs bg-muted rounded">
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm">
                        <Link
                          href={`/txn/${tx.hash}`}
                          className="text-primary hover:underline"
                        >
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        </div>
      )}
    </div>
  );
}
