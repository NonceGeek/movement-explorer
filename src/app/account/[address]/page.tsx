"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useGetAccountResources } from "@/hooks/accounts/useGetAccountResources";
import { useGetAccountTransactions } from "@/hooks/accounts/useGetAccountTransactions";
import { Types } from "aptos";

type TabValue = "transactions" | "resources" | "modules";

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

export default function AccountDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const address = params.address as string;

  const initialTab = (searchParams.get("tab") as TabValue) || "transactions";
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  const {
    data: resources,
    isLoading: resourcesLoading,
    error: resourcesError,
  } = useGetAccountResources(address);

  const { data: transactions, isLoading: transactionsLoading } =
    useGetAccountTransactions(address, undefined, 25);

  const isLoading = resourcesLoading;
  const balance = resources ? getBalance(resources) : null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (resourcesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
          <h2 className="font-semibold">Error</h2>
          <p>Failed to load account {address}</p>
        </div>
      </div>
    );
  }

  const tabs: { value: TabValue; label: string }[] = [
    { value: "transactions", label: "Transactions" },
    { value: "resources", label: `Resources (${resources?.length || 0})` },
    { value: "modules", label: "Modules" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">Account</h1>

      {/* Account Info Card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-mono text-sm break-all">{address}</p>
          </div>
          {balance && (
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="font-mono text-xl font-semibold">{balance} MOVE</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-card border border-border rounded-xl p-6">
        {activeTab === "transactions" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Transactions</h3>
            {transactionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted animate-pulse rounded"
                  />
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold text-sm">
                        Version
                      </th>
                      <th className="text-left p-3 font-semibold text-sm">
                        Type
                      </th>
                      <th className="text-left p-3 font-semibold text-sm">
                        Timestamp
                      </th>
                      <th className="text-left p-3 font-semibold text-sm">
                        Hash
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: Types.Transaction) => {
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
                            <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                              {tx.type.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground text-sm">
                            {timestamp ? formatTimestamp(timestamp) : "-"}
                          </td>
                          <td className="p-3">
                            <Link
                              href={`/txn/${tx.hash}`}
                              className="text-primary hover:underline font-mono text-sm"
                            >
                              {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No transactions found</p>
            )}
          </div>
        )}

        {activeTab === "resources" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Resources ({resources?.length || 0})
            </h3>
            {resources && resources.length > 0 ? (
              <div className="space-y-4">
                {resources.map((resource, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
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
          </div>
        )}

        {activeTab === "modules" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Modules</h3>
            <p className="text-muted-foreground">
              Module viewer coming soon. Check the Resources tab for now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
