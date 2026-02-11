"use client";

import { cn } from "@/utils/styling";
import { TablePagination } from "./TablePagination";
import { DownloadPageData } from "./DownloadPageData";
import { TransactionRowData } from "./types";

export interface TransactionTableToolbarProps {
  currentPage: number;
  totalPages?: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  transactions: TransactionRowData[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Top toolbar for transaction table
 * [First] [Previous] Page X of Y [Next] [Last]   [Download Page Data]
 */
export function TransactionTableToolbar({
  currentPage,
  totalPages,
  hasNextPage,
  onPageChange,
  transactions,
  isLoading = false,
  className,
}: TransactionTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3",
        className
      )}
    >
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        onPageChange={onPageChange}
        disabled={isLoading}
      />

      <DownloadPageData transactions={transactions} disabled={isLoading} />
    </div>
  );
}
