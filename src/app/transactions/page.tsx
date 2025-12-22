"use client";

import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/services/transactions";
import { useGlobalStore } from "@/store/useGlobalStore";
import Link from "next/link";
import { Types } from "aptos";

function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) / 1000);
  return date.toLocaleString();
}

function getTransactionType(tx: Types.Transaction): string {
  return tx.type
    .replace(/_/g, " ")
    .replace(/transaction$/, "")
    .trim();
}

function getTransactionStatus(tx: Types.Transaction): {
  success: boolean;
  label: string;
} {
  if ("success" in tx) {
    return {
      success: tx.success,
      label: tx.success ? "Success" : "Failed",
    };
  }
  return { success: true, label: "Success" };
}

function getSender(tx: Types.Transaction): string | null {
  if (tx.type === "user_transaction" && "sender" in tx) {
    return (tx as Types.UserTransaction).sender;
  }
  if (tx.type === "block_metadata_transaction" && "proposer" in tx) {
    return (tx as Types.BlockMetadataTransaction).proposer;
  }
  return null;
}

export default function TransactionsPage() {
  const { aptos_client, network_value } = useGlobalStore();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", network_value],
    queryFn: () => getTransactions({ limit: 50 }, aptos_client),
    refetchInterval: 10000,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>

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
                <th className="text-left p-4 font-semibold">Version</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Timestamp</th>
                <th className="text-left p-4 font-semibold">Sender</th>
                <th className="text-left p-4 font-semibold">Hash</th>
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
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                          status.success
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {status.success ? "✓" : "✗"} {status.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-1 text-xs bg-muted rounded capitalize">
                        {getTransactionType(tx)}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {timestamp ? formatTimestamp(timestamp) : "-"}
                    </td>
                    <td className="p-4">
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
                    <td className="p-4">
                      <Link
                        href={`/txn/${tx.hash}`}
                        className="text-primary hover:underline font-mono text-sm"
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
      )}
    </div>
  );
}
