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
import { getTransactionDirection } from "@/utils/transaction";
import { EmptyState } from "..";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_DISPLAY = 25;

interface CoinTransfersTabProps {
  address: string;
}

export default function CoinTransfersTab({ address }: CoinTransfersTabProps) {
  const { data: totalCount } = useGetAccountCoinTransfersCount(address);

  const { data: transactionVersions, isLoading: versionsLoading } =
    useGetAccountCoinTransfers(address, MAX_DISPLAY, 0);

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

  const tableData: TransactionRowData[] = (transactions || []).map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return { version, transaction: tx };
  });

  // Filter by direction
  const filteredData =
    directionFilter === "any"
      ? tableData
      : tableData.filter((row) => {
          const dir = getTransactionDirection(row.transaction, address);
          return dir === directionFilter;
        });

  const columnFilters: ColumnFilters = {
    direction: (
      <DirectionColumnFilter
        value={directionFilter}
        onChange={setDirectionFilter}
      />
    ),
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
              </p>
            </div>
          )}

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
