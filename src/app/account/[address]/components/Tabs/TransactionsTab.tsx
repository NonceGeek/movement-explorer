"use client";

import Link from "next/link";
import { useGetAccountTransactionVersions } from "@/hooks/accounts/useGetAccountTransactionVersions";
import { useGetAccountTransactionCount } from "@/hooks/accounts/useGetAccountTransactionCount";
import { Types } from "aptos";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  TransactionTable,
  ACCOUNT_TRANSACTION_COLUMNS,
  TransactionRowData,
  ColumnFilters,
} from "@/components/transactions";
import {
  DateRangeColumnFilter,
  DateRange,
} from "@/components/transactions/filters/DateRangeFilter";
import { AddressColumnFilter } from "@/components/transactions/filters/AddressColumnFilter";
import { Tabs, TabsContent, PillTabsList } from "@/components/ui/tabs";
import { EmptyState } from "..";
import { Activity, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoinTransfersTab from "./CoinTransfersTab";
import NFTTransfersTab from "./NFTTransfersTab";

const MAX_DISPLAY = 25;

type TransactionSubTab = "txns" | "coins" | "nfts";

const SUB_TAB_ITEMS = [
  { value: "txns", label: "Transactions" },
  { value: "coins", label: "Token Transfers" },
  { value: "nfts", label: "NFT Transfers" },
];

interface TransactionsTabProps {
  address: string;
  accountData: Types.AccountData | undefined;
}

export default function TransactionsTab({
  address,
  accountData,
}: TransactionsTabProps) {
  const [subTab, setSubTab] = useState<TransactionSubTab>("txns");

  const handleTabChange = (value: string) => {
    setSubTab(value as TransactionSubTab);
  };

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={handleTabChange}>
        <PillTabsList
          items={SUB_TAB_ITEMS}
          activeTab={subTab}
          onTabChange={handleTabChange}
        />

        <TabsContent value="txns" className="mt-2">
          <TransactionsSubTab address={address} accountData={accountData} />
        </TabsContent>

        <TabsContent value="coins" className="mt-2">
          <CoinTransfersTab address={address} />
        </TabsContent>

        <TabsContent value="nfts" className="mt-2">
          <NFTTransfersTab address={address} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Original transactions list — extracted from the old TransactionsTab */
function TransactionsSubTab({
  address,
  accountData,
}: {
  address: string;
  accountData: Types.AccountData | undefined;
}) {
  const { data: indexerTxCount } = useGetAccountTransactionCount(address);

  const sequenceNum = accountData
    ? parseInt(accountData.sequence_number, 10)
    : 0;

  // Use indexer count if available, otherwise fallback to sequence number
  const totalTxCount =
    indexerTxCount !== undefined ? indexerTxCount : sequenceNum;

  // Filter state (declared before hooks that depend on them)
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const [senderFilter, setSenderFilter] = useState<string | null>(null);

  // Always fetch only the latest 25 transactions (sender filter is server-side)
  const { data: transactionVersions, isLoading: transactionsLoading } =
    useGetAccountTransactionVersions(address, MAX_DISPLAY, 0, dateRange.from, dateRange.to, senderFilter);

  // Fetch full transaction details
  const { aptos_client } = useGlobalStore();
  const { data: transactions, isLoading: detailsLoading } = useQuery({
    queryKey: ["accountTransactionsDetails", address, transactionVersions],
    queryFn: async () => {
      if (!transactionVersions || transactionVersions.length === 0) return [];

      const details = await Promise.all(
        transactionVersions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client),
        ),
      );
      return details;
    },
    enabled: !!transactionVersions && transactionVersions.length > 0,
  });

  // Prepare table data
  const tableData: TransactionRowData[] = (transactions || []).map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return {
      version,
      transaction: tx,
    };
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
    sender: (
      <AddressColumnFilter
        label="Sender"
        value={senderFilter}
        onChange={setSenderFilter}
      />
    ),
  };

  const isLoading = transactionsLoading || detailsLoading;

  const hasActiveFilters = dateRange.from !== null || senderFilter !== null;

  // Show full empty state only when there are no filters active
  if (!isLoading && (!tableData || tableData.length === 0) && !hasActiveFilters) {
    return (
      <EmptyState
        icon={<Activity className="h-12 w-12" />}
        title="No Transactions Yet"
        description="This account hasn't made any transactions on the network."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      {(totalTxCount > 0 || hasActiveFilters) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <p>
            {tableData.length > 0 ? (
              <>
                Latest {Math.min(MAX_DISPLAY, totalTxCount).toLocaleString()} from a total of{" "}
                <span className="font-medium text-foreground">
                  {totalTxCount.toLocaleString()}
                </span>{" "}
                transactions
              </>
            ) : (
              <>No matching transactions</>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setDateRange({ from: null, to: null });
                setSenderFilter(null);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
            >
              <X className="h-3 w-3" />
              filtered
            </button>
          )}
          <Link
            href={`/transactions?address=${address}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      )}

      <div className="overflow-x-auto">
        <TransactionTable
          data={tableData}
          columns={ACCOUNT_TRANSACTION_COLUMNS}
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

      {!isLoading && totalTxCount > MAX_DISPLAY && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/transactions?address=${address}`}>
              View all {totalTxCount.toLocaleString()} transactions
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
