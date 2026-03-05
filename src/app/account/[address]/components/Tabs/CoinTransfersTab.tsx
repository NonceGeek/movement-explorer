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
import { CoinColumnFilter } from "@/components/transactions/filters/CoinColumnFilter";
import {
  DateRangeColumnFilter,
  DateRange,
} from "@/components/transactions/filters/DateRangeFilter";
import { AddressColumnFilter } from "@/components/transactions/filters/AddressColumnFilter";
import { EmptyState } from "..";
import { ArrowLeftRight, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_DISPLAY = 25;

interface CoinTransfersTabProps {
  address: string;
}

export default function CoinTransfersTab({ address }: CoinTransfersTabProps) {
  // Filter state (declared before hooks that depend on them)
  const [coinFilter, setCoinFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const [senderFilter, setSenderFilter] = useState<string | null>(null);

  const { data: totalCount } = useGetAccountCoinTransfersCount(
    address,
    coinFilter,
    dateRange.from,
    dateRange.to,
  );

  const { data: transactionVersions, isLoading: versionsLoading } =
    useGetAccountCoinTransfers(address, MAX_DISPLAY, 0, coinFilter, dateRange.from, dateRange.to, senderFilter);

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

  const tableData: TransactionRowData[] = (transactions || []).map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return { version, transaction: tx };
  });

  const columnFilters: ColumnFilters = {
    timestamp: (
      <DateRangeColumnFilter
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        timestampMode={timestampMode}
        onToggleTimestampMode={setTimestampMode}
      />
    ),
    token: (
      <CoinColumnFilter
        value={coinFilter}
        onChange={setCoinFilter}
      />
    ),
    sender: (
      <AddressColumnFilter
        label="Sender"
        value={senderFilter}
        onChange={setSenderFilter}
      />
    ),
  };

  const hasActiveFilters = coinFilter !== null || dateRange.from !== null || senderFilter !== null;

  const clearAllFilters = () => {
    setCoinFilter(null);
    setDateRange({ from: null, to: null });
    setSenderFilter(null);
  };

  const isLoading = versionsLoading || detailsLoading;
  const displayCount = totalCount ?? (transactionVersions?.length || 0);

  // Show full empty state only when there are no filters active
  if (!isLoading && (!tableData || tableData.length === 0) && !hasActiveFilters) {
    return (
      <EmptyState
        icon={<ArrowLeftRight className="h-12 w-12" />}
        title="No Token Transfers Yet"
        description="This account hasn't made any token transfer activities on the network."
      />
    );
  }

  return (
    <div className="space-y-4">
      {(displayCount > 0 || hasActiveFilters) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <p>
            {tableData.length > 0 ? (
              <>
                Latest{" "}
                {Math.min(MAX_DISPLAY, displayCount).toLocaleString()} from a
                total of{" "}
                <span className="font-medium text-foreground">
                  {displayCount.toLocaleString()}
                </span>{" "}
                token transfers
              </>
            ) : (
              <>No matching token transfers</>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
            >
              <X className="h-3 w-3" />
              filtered
            </button>
          )}
          <Link
            href={`/token-transfers?address=${address}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-guild-green-500 hover:text-guild-green-400 transition-colors"
          >
            View All
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      )}

      <div className="overflow-x-auto">
        <TransactionTable
          data={tableData}
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
            <Link href={`/token-transfers?address=${address}`}>
              View all {displayCount.toLocaleString()} token transfers
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
