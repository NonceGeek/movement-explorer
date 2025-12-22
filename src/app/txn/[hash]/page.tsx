"use client";

import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Types } from "aptos";

type TabValue = "overview" | "payload" | "events" | "changes";

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
  const searchParams = useSearchParams();
  const hash = params.hash as string;

  const initialTab = (searchParams.get("tab") as TabValue) || "overview";
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  const { data: tx, isLoading, error } = useGetTransaction(hash);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
          <h2 className="font-semibold">Error</h2>
          <p>Failed to load transaction {hash}</p>
        </div>
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

  const tabs: { value: TabValue; label: string }[] = [
    { value: "overview", label: "Overview" },
    { value: "payload", label: "Payload" },
    { value: "events", label: `Events (${events?.length || 0})` },
    { value: "changes", label: `Changes (${changes?.length || 0})` },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Transaction Details</h1>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${
            isSuccess
              ? "bg-green-500/10 text-green-600"
              : "bg-red-500/10 text-red-600"
          }`}
        >
          {isSuccess ? "✓ Success" : "✗ Failed"}
        </span>
      </div>

      {/* Overview Card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
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
                className="font-mono text-primary hover:underline"
              >
                {sender}
              </Link>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <span className="inline-block px-2 py-1 text-xs bg-muted rounded capitalize">
              {tx.type.replace(/_/g, " ")}
            </span>
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
        {activeTab === "overview" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Transaction Overview</h3>
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
          </div>
        )}

        {activeTab === "payload" && payload && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Payload</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === "events" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Events ({events?.length || 0})
            </h3>
            {events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
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
          </div>
        )}

        {activeTab === "changes" && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Changes ({changes?.length || 0})
            </h3>
            {changes && changes.length > 0 ? (
              <div className="space-y-4">
                {changes.slice(0, 20).map((change, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
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
          </div>
        )}
      </div>
    </div>
  );
}
