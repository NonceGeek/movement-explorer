"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";
import { useGetCoinActivities } from "@/hooks/coins/useGetCoinActivities";
import { useGetCoinActivitiesCount } from "@/hooks/coins/useGetCoinActivitiesCount";
import { AlertCircle, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_DISPLAY = 25;

interface TransactionsTabProps {
  address: string;
}

export default function TransactionsTab({ address }: TransactionsTabProps) {
  const { aptos_client } = useGlobalStore();

  // Timestamp display mode
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // Fetch total count
  const { data: totalCount } = useGetCoinActivitiesCount(address);

  // Fetch only latest 25 transactions
  const {
    isLoading: activitiesLoading,
    error: activitiesError,
    data: activities,
  } = useGetCoinActivities(address, 0, MAX_DISPLAY);

  const transactionVersions = activities?.map((a) => a.transaction_version);

  // Fetch full transaction details
  const { data: transactions, isLoading: detailsLoading } = useQuery({
    queryKey: ["faTransactionsDetails", address, transactionVersions],
    queryFn: async () => {
      if (!transactionVersions || transactionVersions.length === 0) return [];

      const details = await Promise.all(
        transactionVersions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client)
        )
      );
      return details;
    },
    enabled: !!transactionVersions && transactionVersions.length > 0,
  });

  const isLoading = activitiesLoading || detailsLoading;

  if (activitiesError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium text-destructive mb-2">
          Failed to load transactions
        </p>
        <p className="text-sm text-muted-foreground max-w-md">
          {activitiesError.message}
        </p>
      </div>
    );
  }

  // Prepare table data
  const tableData: TransactionRowData[] = (transactions || []).map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return {
      version,
      transaction: tx,
    };
  });

  if (!isLoading && (!tableData || tableData.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No Transactions Yet</p>
        <p className="text-sm text-muted-foreground">
          No transactions found for this asset.
        </p>
      </div>
    );
  }

  const displayCount = totalCount ?? tableData.length;

  return (
    <div className="space-y-4">
      {/* Info */}
      {displayCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Latest {Math.min(MAX_DISPLAY, displayCount).toLocaleString()} from a
            total of{" "}
            {displayCount > MAX_DISPLAY ? (
              <Link
                href={`/transactions?coinType=${encodeURIComponent(address)}`}
                className="font-medium text-primary hover:underline"
              >
                {displayCount.toLocaleString()}
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                {displayCount.toLocaleString()}
              </span>
            )}{" "}
            transactions
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <TransactionTable
          data={tableData}
          columns={ALL_TRANSACTION_COLUMNS}
          isLoading={isLoading}
          loadingRowCount={MAX_DISPLAY}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
        />
      </div>

      {/* View all link */}
      {!isLoading && displayCount > MAX_DISPLAY && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/transactions?coinType=${encodeURIComponent(address)}`}
            >
              View all {displayCount.toLocaleString()} transactions
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
