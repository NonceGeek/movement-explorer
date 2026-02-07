"use client";

import { useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";
import { useGetCoinActivities } from "@/hooks/coins/useGetCoinActivities";
import { AlertCircle, Activity } from "lucide-react";

const TXN_PER_PAGE = 10;

interface TransactionsTabProps {
  address: string;
}

export default function TransactionsTab({ address }: TransactionsTabProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { aptos_client } = useGlobalStore();

  const currentPage = parseInt(searchParams.get("txPage") ?? "1", 10);
  const offset = (currentPage - 1) * TXN_PER_PAGE;

  // Timestamp display mode
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // Fetch one extra to check if there's a next page
  const {
    isLoading: activitiesLoading,
    error: activitiesError,
    data: activities,
  } = useGetCoinActivities(address, offset, TXN_PER_PAGE + 1);

  const hasNextPage = activities && activities.length > TXN_PER_PAGE;
  const displayActivities = activities?.slice(0, TXN_PER_PAGE);
  const transactionVersions = displayActivities?.map(
    (a) => a.transaction_version
  );

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

  const handlePageChange = (page: number) => {
    const scrollY = window.scrollY;
    const params = new URLSearchParams(searchParams.toString());
    params.set("txPage", page.toString());
    const newPath = `${pathname}?${params.toString()}`;
    window.history.pushState(null, "", newPath);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

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

  const hasPagination = currentPage > 1 || hasNextPage;

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

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <TransactionTable
          data={tableData}
          columns={ALL_TRANSACTION_COLUMNS}
          isLoading={isLoading}
          loadingRowCount={TXN_PER_PAGE}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
        />
      </div>

      {!isLoading && hasPagination && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              <PaginationItem>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  Page {currentPage}
                </span>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (hasNextPage) handlePageChange(currentPage + 1);
                  }}
                  className={
                    !hasNextPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
