"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import { useGetAccountCoinTransfers } from "@/hooks/accounts/useGetAccountCoinTransfers";
import { useGetAccountCoinTransfersCount } from "@/hooks/accounts/useGetAccountCoinTransfersCount";
import {
  TransactionTable,
  TOKEN_TRANSFER_COLUMNS,
  TransactionRowData,
  ColumnFilters,
} from "@/components/transactions";
import {
  DirectionColumnFilter,
  DirectionFilterValue,
} from "@/components/transactions/filters/DirectionColumnFilter";
import { CoinColumnFilter } from "@/components/transactions/filters/CoinColumnFilter";
import {
  DateRangeFilter,
  DateRange,
} from "@/components/transactions/filters/DateRangeFilter";
import { getTransactionDirection, getTransactionAmount } from "@/utils/transaction";
import {
  AmountRangeFilter,
  AmountRange,
} from "@/components/transactions/filters/AmountRangeFilter";
import { EmptyState } from "..";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const MAX_DISPLAY = 25;

interface CoinTransfersTabProps {
  address: string;
}

export default function CoinTransfersTab({ address }: CoinTransfersTabProps) {
  const [coinFilter, setCoinFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  const { data: totalCount } = useGetAccountCoinTransfersCount(
    address,
    coinFilter,
    dateRange.from,
    dateRange.to,
  );

  const { data: transactionVersions, isLoading: versionsLoading } =
    useGetAccountCoinTransfers(address, MAX_DISPLAY, 0, coinFilter, dateRange.from, dateRange.to);

  // Fetch full transaction details (same as TransactionsSubTab)
  const { aptos_client } = useGlobalStore();
  const { data: transactions, isLoading: detailsLoading } = useQuery({
    queryKey: [
      "accountCoinTransferDetails",
      address,
      transactionVersions,
    ],
    queryFn: async () => {
      if (!transactionVersions || transactionVersions.length === 0) return [];
      return Promise.all(
        transactionVersions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client),
        ),
      );
    },
    enabled: !!transactionVersions && transactionVersions.length > 0,
  });

  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilterValue>("any");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [amountRange, setAmountRange] = useState<AmountRange>({ min: "", max: "" });

  const tableData: TransactionRowData[] = (transactions || []).map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return { version, transaction: tx };
  });

  // Filter by direction and status
  const filteredData = tableData
    .filter((row) => {
      if (directionFilter === "any") return true;
      return getTransactionDirection(row.transaction, address) === directionFilter;
    })
    .filter((row) => {
      if (statusFilter === "all") return true;
      const success = "success" in row.transaction ? row.transaction.success : true;
      return statusFilter === "success" ? success : !success;
    })
    .filter((row) => {
      if (amountRange.min === "" && amountRange.max === "") return true;
      const amount = getTransactionAmount(row.transaction);
      if (amount === undefined) return amountRange.min === "" && amountRange.max === "";
      // Convert from octas to MOVE (8 decimals)
      const amountInMove = Number(amount) / 1e8;
      if (amountRange.min !== "" && amountInMove < Number(amountRange.min)) return false;
      if (amountRange.max !== "" && amountInMove > Number(amountRange.max)) return false;
      return true;
    });

  const columnFilters: ColumnFilters = {
    direction: (
      <DirectionColumnFilter
        value={directionFilter}
        onChange={setDirectionFilter}
      />
    ),
    token: (
      <CoinColumnFilter
        value={coinFilter}
        onChange={setCoinFilter}
      />
    ),
    amount: (
      <AmountRangeFilter
        value={amountRange}
        onChange={setAmountRange}
      />
    ),
  };

  const hasActiveFilters = directionFilter !== "any" || coinFilter !== null || statusFilter !== "all" || dateRange.from !== null || amountRange.min !== "" || amountRange.max !== "";

  const clearAllFilters = () => {
    setDirectionFilter("any");
    setCoinFilter(null);
    setStatusFilter("all");
    setDateRange({ from: null, to: null });
    setAmountRange({ min: "", max: "" });
  };

  const isLoading = versionsLoading || detailsLoading;
  const displayCount = totalCount ?? (transactionVersions?.length || 0);

  return (
    <>
      {!isLoading && (!tableData || tableData.length === 0) ? (
        <EmptyState
          icon={<ArrowLeftRight className="h-12 w-12" />}
          title="No Token Transfers Yet"
          description="This account hasn't made any token transfer activities on the network."
        />
      ) : (
        <div className="space-y-4">
          {displayCount > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Latest{" "}
                {Math.min(MAX_DISPLAY, displayCount).toLocaleString()} from a
                total of{" "}
                {displayCount > MAX_DISPLAY ? (
                  <Link
                    href={`/token-transfers?address=${address}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {displayCount.toLocaleString()}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">
                    {displayCount.toLocaleString()}
                  </span>
                )}{" "}
                token transfers
                {hasActiveFilters && (
                  <>
                    <span className="text-primary/80 ml-1">(filtered)</span>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-primary hover:underline ml-2"
                    >
                      Clear Filters
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Filter toolbar */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <ToggleGroup
                value={statusFilter}
                onValueChange={(v) => v && setStatusFilter(v as "all" | "success" | "failed")}
                size="sm"
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="success">Success</ToggleGroupItem>
                <ToggleGroupItem value="failed">Failed</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>

          <div className="overflow-x-auto">
            <TransactionTable
              data={filteredData}
              columns={TOKEN_TRANSFER_COLUMNS}
              isLoading={isLoading}
              loadingRowCount={MAX_DISPLAY}
              timestampMode={timestampMode}
              onToggleTimestampMode={() =>
                setTimestampMode((prev) =>
                  prev === "age" ? "dateTime" : "age",
                )
              }
              address={address}
              columnFilters={columnFilters}
            />
          </div>

          {!isLoading && displayCount > MAX_DISPLAY && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/token-transfers?address=${address}`}
                >
                  View all {displayCount.toLocaleString()} token transfers
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
