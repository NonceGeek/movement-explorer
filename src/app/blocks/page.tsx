"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Types } from "aptos";
import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  StyledTableRow,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { useGlobalStore } from "@/store/useGlobalStore";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { getLedgerInfo } from "@/services";
import { NewDataNotification } from "@/components/common/NewDataNotification";
import { TableLoadingBar } from "@/components/common/TableLoadingBar";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { TimestampToggle } from "@/components/common/TimestampToggle";
import { TimestampModeToggle } from "@/components/common/TimestampModeToggle";
import {
  useBlocksPaginationStore,
  PageSize,
  DEFAULT_PAGE_SIZE,
} from "@/store/useBlocksPaginationStore";
import {
  BlockTableToolbar,
  BlockTableFooter,
  BlockRowData,
} from "@/components/blocks";
import { useStreamingBlocks } from "@/hooks/blocks/useStreamingBlocks";

const POLL_INTERVAL = 15000;
const COLUMN_COUNT = 6;

function getTransactionCount(block: Types.Block): string {
  return (
    BigInt(block.last_version) -
    BigInt(block.first_version) +
    BigInt(1)
  ).toString();
}

function BlocksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { aptos_client, network_value } = useGlobalStore();
  const { pageSize, setPageSize } = useBlocksPaginationStore();
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // Get page from URL or default to 1
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1;

  // Get limit from URL or use store value
  const limitParam = searchParams.get("limit");
  const currentLimit: PageSize = limitParam
    ? (parseInt(limitParam) as PageSize) || DEFAULT_PAGE_SIZE
    : pageSize;

  // State for manual refresh
  const [frozenMaxHeight, setFrozenMaxHeight] = useState<number>(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const isListFetching =
    useIsFetching({ queryKey: ["blocks", "paged", network_value] }) > 0;

  // Poll ledger info to detect new blocks
  const { data: ledgerInfo, isLoading: isLedgerLoading } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: POLL_INTERVAL,
    enabled: !isListFetching,
  });

  const latestMaxHeight = ledgerInfo ? parseInt(ledgerInfo.block_height) : 0;

  // Initialize frozenMaxHeight once on first load
  useEffect(() => {
    if (frozenMaxHeight === 0 && latestMaxHeight > 0) {
      setFrozenMaxHeight(latestMaxHeight);
    }
  }, [latestMaxHeight, frozenMaxHeight]);

  const hasNewData =
    frozenMaxHeight > 0 && latestMaxHeight > frozenMaxHeight;

  // Use frozenMaxHeight for the list query to keep it stable
  const queryMaxHeight =
    frozenMaxHeight > 0 ? frozenMaxHeight : latestMaxHeight;

  // Calculate block heights for current page (descending order)
  const blockHeights = useMemo(() => {
    if (queryMaxHeight === 0) return undefined;
    const startHeight = queryMaxHeight - (currentPage - 1) * currentLimit;
    const heights: number[] = [];
    for (let i = 0; i < currentLimit; i++) {
      const h = startHeight - i;
      if (h >= 0) heights.push(h);
    }
    return heights;
  }, [queryMaxHeight, currentPage, currentLimit]);

  const hasNextPage = blockHeights
    ? blockHeights[blockHeights.length - 1] - 1 > 0
    : false;

  // Stream block details as they resolve
  const {
    rows: streamingRows,
    isStreaming,
    isComplete,
  } = useStreamingBlocks(
    blockHeights,
    aptos_client,
    queryMaxHeight > 0,
  );

  // Only fully loaded rows (for toolbar download)
  const loadedRows: BlockRowData[] = streamingRows
    .filter((r) => r.block !== null)
    .map((r) => ({ blockHeight: r.blockHeight, block: r.block! }));

  const isLoading =
    (isLedgerLoading && frozenMaxHeight === 0) && streamingRows.length === 0;

  // Update isFirstLoad
  useEffect(() => {
    if (isComplete && streamingRows.length > 0) {
      setIsFirstLoad(false);
    }
  }, [isComplete, streamingRows.length]);

  const isRefreshing = isStreaming && !isFirstLoad;

  // URL sync handlers
  const updateURL = useCallback(
    (page: number, limit: PageSize) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      router.push(`/blocks?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1) {
        updateURL(page, currentLimit);
      }
    },
    [currentLimit, updateURL]
  );

  const handlePageSizeChange = useCallback(
    (size: PageSize) => {
      setPageSize(size);
      // Reset to page 1 when changing page size
      updateURL(1, size);
    },
    [setPageSize, updateURL]
  );

  const handleRefresh = () => {
    setFrozenMaxHeight(latestMaxHeight);
    // Reset to page 1 on refresh
    updateURL(1, currentLimit);
  };

  return (
    <>
      <PageNavigation />
      <PageContainer>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Blocks</h1>
          <NewDataNotification
            visible={hasNewData}
            onClick={handleRefresh}
            isLoading={isRefreshing}
          />
        </div>

        {/* Top Toolbar */}
        <BlockTableToolbar
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          onPageChange={handlePageChange}
          blocks={loadedRows}
          isLoading={isLoading}
          infoText={
            (latestMaxHeight > 0 || queryMaxHeight > 0) && (
              <>
                Network Height{" "}
                <span className="font-medium text-foreground">
                  #{latestMaxHeight > 0 ? latestMaxHeight : queryMaxHeight}
                </span>
              </>
            )
          }
        />

        <div className="relative overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TableLoadingBar visible={isStreaming && !isLoading} />
          <StyledTable>
            <StyledTableHeader>
              <StyledTableHeaderRow>
                <StyledTableHead>Height</StyledTableHead>
                <StyledTableHead>Hash</StyledTableHead>
                <StyledTableHead>
                  <TimestampModeToggle
                    mode={timestampMode}
                    setMode={setTimestampMode}
                  />
                </StyledTableHead>
                <StyledTableHead className="text-right">
                  Transactions
                </StyledTableHead>
                <StyledTableHead className="text-right">
                  First Version
                </StyledTableHead>
                <StyledTableHead className="text-right">
                  Last Version
                </StyledTableHead>
              </StyledTableHeaderRow>
            </StyledTableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: currentLimit }).map((_, i) => (
                    <TableRow key={i} className="h-16">
                      <TableCell colSpan={COLUMN_COUNT}>
                        <EnhancedSkeleton className="h-13 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : streamingRows.map((row) =>
                    row.block ? (
                      <StyledTableRow
                        key={row.blockHeight}
                        className="animate-in slide-in-from-top-2 fade-in duration-500 cursor-pointer"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('a, button, [role="button"]'))
                            return;
                          router.push(`/block/${row.blockHeight}`);
                        }}
                      >
                        <TableCell>
                          <Link
                            href={`/block/${row.block.block_height}`}
                            className="text-primary hover:underline font-mono tabular-nums"
                          >
                            {row.block.block_height}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <CopyableAddress
                            address={row.block.block_hash}
                            className="text-primary"
                            truncateLength={{ start: 10, end: 8 }}
                            copyTooltip="Copy hash"
                          />
                        </TableCell>
                        <TableCell className="text-foreground/80 text-sm whitespace-nowrap min-w-[120px]">
                          <TimestampToggle
                            timestamp={row.block.block_timestamp}
                            timestampMode={timestampMode}
                            onToggle={() =>
                              setTimestampMode((prev) =>
                                prev === "age" ? "dateTime" : "age",
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {getTransactionCount(row.block)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/txn/${row.block.first_version}`}
                            className="text-primary hover:underline font-mono tabular-nums"
                          >
                            {row.block.first_version}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/txn/${row.block.last_version}`}
                            className="text-primary hover:underline font-mono tabular-nums"
                          >
                            {row.block.last_version}
                          </Link>
                        </TableCell>
                      </StyledTableRow>
                    ) : (
                      <TableRow key={row.blockHeight} className="h-16">
                        <TableCell colSpan={COLUMN_COUNT}>
                          <EnhancedSkeleton className="h-13 w-full" />
                        </TableCell>
                      </TableRow>
                    ),
                  )}
            </TableBody>
          </StyledTable>
        </div>

        {/* Bottom Footer */}
        <BlockTableFooter
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          onPageChange={handlePageChange}
          pageSize={currentLimit}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      </PageContainer>
    </>
  );
}

export default function BlocksPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <EnhancedSkeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <BlocksContent />
    </Suspense>
  );
}
