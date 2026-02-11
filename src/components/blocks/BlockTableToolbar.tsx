"use client";

import { cn } from "@/utils/styling";
import { TablePagination } from "@/components/transactions/TablePagination";
import { DownloadBlockData } from "./DownloadBlockData";
import { BlockRowData } from "./types";

export interface BlockTableToolbarProps {
  currentPage: number;
  hasNextPage?: boolean;
  onPageChange: (page: number) => void;
  blocks: BlockRowData[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Top toolbar for block table
 * [First] [Previous] Page X [Next] [Last]   [Download Page Data]
 */
export function BlockTableToolbar({
  currentPage,
  hasNextPage,
  onPageChange,
  blocks,
  isLoading = false,
  className,
}: BlockTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3",
        className
      )}
    >
      <TablePagination
        currentPage={currentPage}
        hasNextPage={hasNextPage}
        onPageChange={onPageChange}
        disabled={isLoading}
      />

      <DownloadBlockData blocks={blocks} disabled={isLoading} />
    </div>
  );
}
