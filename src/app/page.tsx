"use client";

import { useQuery } from "@tanstack/react-query";
import { getLedgerInfo } from "@/services/general";
import { getTransactions } from "@/services/transactions";
import { useGlobalStore } from "@/store/useGlobalStore";
import Link from "next/link";
import { Types } from "aptos";
import { SearchBar } from "@/components/search";

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
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Explorer</h1>
        <p className="text-muted-foreground mb-6">
          Explore blocks, transactions, and accounts on the Movement network.
        </p>

        {/* Search Bar */}
        <SearchBar />
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Block Height</p>
          {ledgerLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold font-mono">
              {formatNumber(ledgerInfo?.block_height || 0)}
            </p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Ledger Version</p>
          {ledgerLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold font-mono">
              {formatNumber(ledgerInfo?.ledger_version || 0)}
            </p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Chain ID</p>
          {ledgerLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold font-mono">
              {ledgerInfo?.chain_id || "-"}
            </p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Epoch</p>
          {ledgerLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-2xl font-bold font-mono">
              {formatNumber(ledgerInfo?.epoch || 0)}
            </p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/blocks"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          View Blocks
        </Link>
        <Link
          href="/transactions"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          View Transactions
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <Link
            href="/transactions"
            className="text-primary hover:underline text-sm"
          >
            View all →
          </Link>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold text-sm">
                    Version
                  </th>
                  <th className="text-left p-3 font-semibold text-sm">
                    Status
                  </th>
                  <th className="text-left p-3 font-semibold text-sm">Type</th>
                  <th className="text-left p-3 font-semibold text-sm">
                    Timestamp
                  </th>
                  <th className="text-left p-3 font-semibold text-sm">
                    Sender
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((tx: Types.Transaction) => {
                  const status = getTransactionStatus(tx);
                  const sender = getSender(tx);
                  const version = "version" in tx ? tx.version : null;
                  const timestamp = "timestamp" in tx ? tx.timestamp : null;

                  return (
                    <tr
                      key={tx.hash}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="p-3">
                        {version && (
                          <Link
                            href={`/txn/${version}`}
                            className="text-primary hover:underline font-mono text-sm"
                          >
                            {version}
                          </Link>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                            status.success
                              ? "bg-green-500/10 text-green-600"
                              : "bg-red-500/10 text-red-600"
                          }`}
                        >
                          {status.success ? "✓" : "✗"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                          {tx.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-sm">
                        {timestamp ? formatTimestamp(timestamp) : "-"}
                      </td>
                      <td className="p-3">
                        {sender ? (
                          <Link
                            href={`/account/${sender}`}
                            className="text-primary hover:underline font-mono text-sm"
                          >
                            {sender.slice(0, 8)}...{sender.slice(-6)}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
