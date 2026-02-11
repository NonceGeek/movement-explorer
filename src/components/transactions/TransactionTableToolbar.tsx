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
  infoText?: React.ReactNode;
}

/**
 * Top toolbar for transaction table
 *
 * Mobile:
 *   [infoText]              [Download]
 *       [<< < Page X of Y > >>]
 *
 * Desktop:
 *   [infoText]   [Download] [<< < Page X of Y > >>]
 */
export function TransactionTableToolbar({
  currentPage,
  totalPages,
  hasNextPage,
  onPageChange,
  transactions,
  isLoading = false,
  className,
  infoText,
}: TransactionTableToolbarProps) {
  const paginationProps = {
    currentPage,
    totalPages,
    hasNextPage,
    onPageChange,
    disabled: isLoading,
  };

  return (
    <div className={cn("py-3 flex flex-col gap-3", className)}>
      {/* Row 1: info text + download (+ pagination on desktop) */}
      <div className="flex items-center justify-between">
        {infoText && (
          <div className="text-sm text-muted-foreground">{infoText}</div>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <DownloadPageData transactions={transactions} disabled={isLoading} />
          <TablePagination {...paginationProps} className="hidden sm:flex" />
        </div>
      </div>

      {/* Row 2: pagination (mobile only) */}
      <div className="flex sm:hidden">
        <TablePagination {...paginationProps} />
      </div>
    </div>
  );
}
