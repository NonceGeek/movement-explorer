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
  infoText?: React.ReactNode;
}

/**
 * Top toolbar for block table
 *
 * Mobile:
 *   [infoText]              [Download]
 *       [<< < Page X > >>]
 *
 * Desktop:
 *   [infoText]   [Download] [<< < Page X > >>]
 */
export function BlockTableToolbar({
  currentPage,
  hasNextPage,
  onPageChange,
  blocks,
  isLoading = false,
  className,
  infoText,
}: BlockTableToolbarProps) {
  const paginationProps = {
    currentPage,
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
          <DownloadBlockData blocks={blocks} disabled={isLoading} />
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
