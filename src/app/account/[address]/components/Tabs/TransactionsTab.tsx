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
  DirectionColumnFilter,
  DirectionFilterValue,
} from "@/components/transactions/filters/DirectionColumnFilter";
import {
  DateRangeFilter,
  DateRange,
} from "@/components/transactions/filters/DateRangeFilter";
import {
  getTransactionDirection,
  getTransactionFunction,
  getTransactionAmount,
} from "@/utils/transaction";
import {
  AmountRangeFilter,
  AmountRange,
} from "@/components/transactions/filters/AmountRangeFilter";
import { FunctionColumnFilter } from "@/components/transactions/filters/FunctionColumnFilter";
import { Tabs, TabsContent, PillTabsList } from "@/components/ui/tabs";
import { EmptyState } from "..";
import { Activity, ArrowRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  // Always fetch only the latest 25 transactions
  const { data: transactionVersions, isLoading: transactionsLoading } =
    useGetAccountTransactionVersions(address, MAX_DISPLAY, 0, dateRange.from, dateRange.to);

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

  // Timestamp display mode
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilterValue>("any");
  const [functionFilter, setFunctionFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [amountRange, setAmountRange] = useState<AmountRange>({ min: "", max: "" });

  // Prepare table data
  const tableData: TransactionRowData[] = (transactions || []).map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return {
      version,
      transaction: tx,
    };
  });

  // Filter by direction and function
  const filteredData = tableData
    .filter((row) => {
      if (directionFilter === "any") return true;
      return getTransactionDirection(row.transaction, address) === directionFilter;
    })
    .filter((row) => {
      if (!functionFilter) return true;
      return getTransactionFunction(row.transaction) === functionFilter;
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
    function: (
      <FunctionColumnFilter
        value={functionFilter}
        onChange={setFunctionFilter}
        transactions={tableData}
      />
    ),
    amount: (
      <AmountRangeFilter
        value={amountRange}
        onChange={setAmountRange}
      />
    ),
  };

  const isLoading = transactionsLoading || detailsLoading;

  return (
    <>
      {!isLoading && (!tableData || tableData.length === 0) ? (
        <EmptyState
          icon={<Activity className="h-12 w-12" />}
          title="No Transactions Yet"
          description="This account hasn't made any transactions on the network."
        />
      ) : (
        <div className="space-y-4">
          {/* Info */}
          {totalTxCount > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Latest {Math.min(MAX_DISPLAY, totalTxCount).toLocaleString()} from a total of{" "}
                {totalTxCount > MAX_DISPLAY ? (
                  <Link
                    href={`/transactions?address=${address}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {totalTxCount.toLocaleString()}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">
                    {totalTxCount.toLocaleString()}
                  </span>
                )}{" "}
                transactions
                {(directionFilter !== "any" || functionFilter !== null || dateRange.from !== null || statusFilter !== "all" || amountRange.min !== "" || amountRange.max !== "") && (
                  <>
                    <span className="text-primary/80 ml-1">(filtered)</span>
                    <button
                      onClick={() => {
                        setDirectionFilter("any");
                        setFunctionFilter(null);
                        setDateRange({ from: null, to: null });
                        setStatusFilter("all");
                        setAmountRange({ min: "", max: "" });
                      }}
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
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
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
            <Button variant="ghost" size="sm" asChild className="ml-auto text-xs h-7">
              <Link href={`/transactions?address=${address}`}>
                <SlidersHorizontal className="h-3 w-3 mr-1" />
                Advanced
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <TransactionTable
              data={filteredData}
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

          {/* View all link */}
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
      )}
    </>
  );
}
