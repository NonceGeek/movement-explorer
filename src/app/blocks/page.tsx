"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useState, useEffect, useCallback, Suspense } from "react";
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
import {
  useQuery,
  useIsFetching,
  keepPreviousData,
} from "@tanstack/react-query";
import { getLedgerInfo, getRecentBlocks } from "@/services";
import { NewDataNotification } from "@/components/common/NewDataNotification";
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

const POLL_INTERVAL = 3000;
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

  // Calculate start height for current page (descending order)
  const getStartHeightForPage = useCallback(
    (page: number) => {
      if (queryMaxHeight === 0) return 0;
      // Page 1 shows newest blocks (highest heights)
      // Page 2 shows older blocks, etc.
      return queryMaxHeight - (page - 1) * currentLimit;
    },
    [queryMaxHeight, currentLimit]
  );

  // Fetch blocks for current page
  const {
    data: fetchedData,
    isLoading: isBlocksLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "blocks",
      "paged",
      network_value,
      queryMaxHeight,
      currentPage,
      currentLimit,
    ],
    queryFn: async () => {
      const startHeight = getStartHeightForPage(currentPage);
      const blocks = await getRecentBlocks(startHeight, currentLimit, aptos_client);
      // Has next page if we can go further back (lowest block height > 0)
      const lowestHeight = startHeight - currentLimit + 1;
      return {
        blocks,
        hasNextPage: lowestHeight > 0,
      };
    },
    enabled: queryMaxHeight > 0,
    placeholderData: keepPreviousData,
  });

  const blocks = fetchedData?.blocks ?? [];
  const hasNextPage = fetchedData?.hasNextPage ?? false;

  const isLoading =
    (isLedgerLoading && frozenMaxHeight === 0) ||
    (isBlocksLoading && queryMaxHeight > 0);

  // Transform blocks to table data
  const tableData: BlockRowData[] = blocks.map((block) => ({
    blockHeight: parseInt(block.block_height),
    block,
  }));

  // Update isFirstLoad
  useEffect(() => {
    if (!isBlocksLoading && blocks.length > 0) {
      setIsFirstLoad(false);
    }
  }, [isBlocksLoading, blocks]);

  const isRefreshing = isFetching && !isFirstLoad;

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
          blocks={tableData}
          isLoading={isLoading}
        />

        <div className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                : blocks.map((block: Types.Block) => (
                    <StyledTableRow
                      key={block.block_height}
                      className="animate-in slide-in-from-top-2 fade-in duration-500 cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('a, button, [role="button"]')) return;
                        router.push(`/block/${block.block_height}`);
                      }}
                    >
                      <TableCell>
                        <Link
                          href={`/block/${block.block_height}`}
                          className="text-primary hover:underline font-mono tabular-nums"
                        >
                          {block.block_height}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <CopyableAddress
                          address={block.block_hash}
                          truncateLength={{ start: 10, end: 8 }}
                          copyTooltip="Copy hash"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap min-w-[120px]">
                        <TimestampToggle
                          timestamp={block.block_timestamp}
                          timestampMode={timestampMode}
                          onToggle={() =>
                            setTimestampMode((prev) =>
                              prev === "age" ? "dateTime" : "age",
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {getTransactionCount(block)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/txn/${block.first_version}`}
                          className="text-primary hover:underline font-mono tabular-nums"
                        >
                          {block.first_version}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/txn/${block.last_version}`}
                          className="text-primary hover:underline font-mono tabular-nums"
                        >
                          {block.last_version}
                        </Link>
                      </TableCell>
                    </StyledTableRow>
                  ))}
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
