"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadBlocksAsCSV } from "@/utils/csvExportBlocks";
import { BlockRowData } from "./types";
import { cn } from "@/utils/styling";

export interface DownloadBlockDataProps {
  blocks: BlockRowData[];
  disabled?: boolean;
  className?: string;
}

/**
 * Download current page block data as CSV
 */
export function DownloadBlockData({
  blocks,
  disabled = false,
  className,
}: DownloadBlockDataProps) {
  const handleDownload = () => {
    if (blocks.length === 0) return;
    downloadBlocksAsCSV(blocks);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={disabled || blocks.length === 0}
      className={cn("h-8 gap-1.5 text-xs", className)}
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Export Page as CSV</span>
      <span className="sm:hidden">CSV</span>
    </Button>
  );
}
