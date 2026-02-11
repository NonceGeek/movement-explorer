"use client";

import { cn } from "@/utils/styling";
import { TablePagination } from "@/components/transactions/TablePagination";
import { PageSizeSelector } from "@/components/transactions/PageSizeSelector";
import { PageSize } from "@/store/useBlocksPaginationStore";

export interface BlockTableFooterProps {
  currentPage: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  pageSize: PageSize;
  onPageSizeChange: (size: PageSize) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Bottom footer for block table
 * Show: [10] [25] [50] [100] Records
 * [First] [Previous] Page X [Next] [Last]
 */
export function BlockTableFooter({
  currentPage,
  hasNextPage,
  onPageChange,
  pageSize,
  onPageSizeChange,
  isLoading = false,
  className,
}: BlockTableFooterProps) {
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
        hasNextPage={hasNextPage}
        onPageChange={onPageChange}
        disabled={isLoading}
      />
    </div>
  );
}
