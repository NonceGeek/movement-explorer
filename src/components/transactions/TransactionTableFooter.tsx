"use client";

import { cn } from "@/utils/styling";
import { TablePagination } from "./TablePagination";
import { PageSizeSelector } from "./PageSizeSelector";
import { PageSize } from "@/store/useTransactionPaginationStore";

export interface TransactionTableFooterProps {
  currentPage: number;
  totalPages?: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  pageSize: PageSize;
  onPageSizeChange: (size: PageSize) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Bottom footer for transaction table
 * Show: [10] [25] [50] [100] Records
 * [First] [Previous] Page X of Y [Next] [Last]
 */
export function TransactionTableFooter({
  currentPage,
  totalPages,
  hasNextPage,
  onPageChange,
  pageSize,
  onPageSizeChange,
  isLoading = false,
  className,
}: TransactionTableFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4",
        className
      )}
    >
      <PageSizeSelector
        value={pageSize}
        onChange={onPageSizeChange}
        disabled={isLoading}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        onPageChange={onPageChange}
        disabled={isLoading}
      />
    </div>
  );
}
