"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/utils/styling";

export interface TablePaginationProps {
  currentPage: number;
  totalPages?: number; // Optional - if not provided, uses hasNextPage
  hasNextPage?: boolean; // For APIs that don't return total count
  onPageChange: (page: number) => void;
  onFirstPage?: () => void;
  onLastPage?: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Table pagination component
 * [First] [Previous] Page X of Y [Next] [Last]
 *
 * Supports two modes:
 * 1. With totalPages: Shows "Page X of Y" and enables First/Last buttons
 * 2. With hasNextPage: Shows "Page X" and disables Last button (for APIs without total count)
 */
export function TablePagination({
  currentPage,
  totalPages,
  hasNextPage,
  onPageChange,
  onFirstPage,
  onLastPage,
  className,
  disabled = false,
}: TablePaginationProps) {
  const isFirstPage = currentPage <= 1;

  // Determine if there's a next page
  const canGoNext =
    hasNextPage !== undefined
      ? hasNextPage
      : totalPages !== undefined
        ? currentPage < totalPages
        : false;

  // Can only go to last page if we know totalPages
  const canGoLast = totalPages !== undefined && currentPage < totalPages;

  const handleFirst = () => {
    if (!isFirstPage && !disabled) {
      if (onFirstPage) {
        onFirstPage();
      } else {
        onPageChange(1);
      }
    }
  };

  const handlePrevious = () => {
    if (!isFirstPage && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext && !disabled) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLast = () => {
    if (canGoLast && !disabled && totalPages) {
      if (onLastPage) {
        onLastPage();
      } else {
        onPageChange(totalPages);
      }
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleFirst}
        disabled={isFirstPage || disabled}
        className="h-8 px-2 text-xs"
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">First</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={isFirstPage || disabled}
        className="h-8 px-2 text-xs"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Previous</span>
      </Button>

      <span className="px-3 py-1.5 text-sm text-muted-foreground whitespace-nowrap">
        Page{" "}
        <span className="font-medium text-foreground">
          {currentPage.toLocaleString()}
        </span>
        {totalPages !== undefined && (
          <>
            {" "}
            of{" "}
            <span className="font-medium text-foreground">
              {totalPages.toLocaleString()}
            </span>
          </>
        )}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={!canGoNext || disabled}
        className="h-8 px-2 text-xs"
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleLast}
        disabled={!canGoLast || disabled}
        className="h-8 px-2 text-xs"
      >
        <span className="hidden sm:inline mr-1">Last</span>
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
