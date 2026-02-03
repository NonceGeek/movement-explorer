"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useGetAccountTransactionVersions } from "@/hooks/accounts/useGetAccountTransactionVersions";
import { useGetAccountTransactionCount } from "@/hooks/accounts/useGetAccountTransactionCount";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Types } from "aptos";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";

const TXN_PER_PAGE = 25;

function getPageStartSequenceNumbers(sequenceNum: number): number[] {
  const pageStarts: number[] = [];
  const numOfPages = Math.ceil(sequenceNum / TXN_PER_PAGE);
  let num = sequenceNum;
  for (let i = 0; i < numOfPages; i++) {
    num = num - TXN_PER_PAGE;
    num = num >= 0 ? num : 0;
    pageStarts.push(num);
  }
  return pageStarts;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages: (number | "ellipsis")[] = [];
  const showPages = 5;
  const halfShow = Math.floor(showPages / 2);

  let startPage = Math.max(1, currentPage - halfShow);
  let endPage = Math.min(totalPages, currentPage + halfShow);

  if (currentPage <= halfShow) {
    endPage = Math.min(totalPages, showPages);
  } else if (currentPage >= totalPages - halfShow) {
    startPage = Math.max(1, totalPages - showPages + 1);
  }

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push("ellipsis");
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return pages;
}

interface TransactionsTabProps {
  address: string;
  accountData: Types.AccountData | undefined;
}

export default function TransactionsTab({
  address,
  accountData,
}: TransactionsTabProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { data: indexerTxCount } = useGetAccountTransactionCount(address);

  const currentTxPage = parseInt(searchParams.get("txPage") ?? "1", 10);
  const sequenceNum = accountData
    ? parseInt(accountData.sequence_number, 10)
    : 0;

  // Use indexer count if available, otherwise fallback to sequence number (only for accounts)
  const totalTxCount =
    indexerTxCount !== undefined ? indexerTxCount : sequenceNum;

  const totalTxPages = Math.max(1, Math.ceil(totalTxCount / TXN_PER_PAGE));

  // offset for Indexer API
  const txOffset = (currentTxPage - 1) * TXN_PER_PAGE;

  const { data: transactionVersions, isLoading: transactionsLoading } =
    useGetAccountTransactionVersions(address, TXN_PER_PAGE, txOffset);

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

  const txVisiblePages = getVisiblePages(currentTxPage, totalTxPages);

  // Timestamp display mode
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  const handleTxPageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("txPage", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Prepare table data
  const tableData: TransactionRowData[] = (transactions || []).map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return {
      version,
      transaction: tx,
    };
  });

  const isLoading = transactionsLoading || detailsLoading;

  return (
    <>
      {!isLoading && (!tableData || tableData.length === 0) ? (
        <p className="text-muted-foreground">No transactions found</p>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <TransactionTable
              data={tableData}
              columns={ALL_TRANSACTION_COLUMNS}
              isLoading={isLoading}
              loadingRowCount={TXN_PER_PAGE}
              timestampMode={timestampMode}
              onToggleTimestampMode={() =>
                setTimestampMode((prev) =>
                  prev === "age" ? "dateTime" : "age",
                )
              }
            />
          </div>

          {!isLoading && totalTxPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentTxPage > 1)
                          handleTxPageChange(currentTxPage - 1);
                      }}
                      className={
                        currentTxPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {txVisiblePages.map((page, i) =>
                    page === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentTxPage}
                          onClick={(e) => {
                            e.preventDefault();
                            handleTxPageChange(page as number);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentTxPage < totalTxPages)
                          handleTxPageChange(currentTxPage + 1);
                      }}
                      className={
                        currentTxPage === totalTxPages
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
      )}
    </>
  );
}
