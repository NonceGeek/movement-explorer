"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadTransactionsAsCSV } from "@/utils/csvExport";
import { TransactionRowData } from "./types";
import { cn } from "@/utils/styling";

export interface DownloadPageDataProps {
  transactions: TransactionRowData[];
  disabled?: boolean;
  className?: string;
}

/**
 * Download current page data as CSV
 */
export function DownloadPageData({
  transactions,
  disabled = false,
  className,
}: DownloadPageDataProps) {
  const handleDownload = () => {
    if (transactions.length === 0) return;
    downloadTransactionsAsCSV(transactions);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={disabled || transactions.length === 0}
      className={cn("h-8 gap-1.5 text-xs", className)}
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Export Page as CSV</span>
      <span className="sm:hidden">CSV</span>
    </Button>
  );
}
