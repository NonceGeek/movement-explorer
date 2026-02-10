"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Types } from "aptos";
import { Suspense } from "react";
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
  useInfiniteQuery,
  useQuery,
  useIsFetching,
} from "@tanstack/react-query";
import { getLedgerInfo, getRecentBlocks } from "@/services";
import { Button } from "@movementlabsxyz/movement-design-system";
import { Loader2 } from "lucide-react";
import { NewDataNotification } from "@/components/common/NewDataNotification";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { TimestampToggle } from "@/components/common/TimestampToggle";
import { TimestampModeToggle } from "@/components/common/TimestampModeToggle";

const BLOCKS_COUNT = 20;
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
  const { aptos_client, network_value } = useGlobalStore();
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const isListFetching =
    useIsFetching({ queryKey: ["blocks", "infinite", network_value] }) > 0;

  // State for manual refresh
  const [frozenMaxHeight, setFrozenMaxHeight] = useState<number>(0);

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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading: isBlocksLoading,
  } = useInfiniteQuery({
    queryKey: ["blocks", "infinite", network_value, queryMaxHeight],
    queryFn: async ({ pageParam }) => {
      return getRecentBlocks(pageParam, BLOCKS_COUNT, aptos_client);
    },
    initialPageParam: queryMaxHeight,
    getNextPageParam: (lastPage) => {
      if (queryMaxHeight === 0) return undefined;

      const lastBlock = lastPage[lastPage.length - 1];
      if (!lastBlock) return undefined;

      const nextStart = parseInt(lastBlock.block_height) - 1;
      if (nextStart >= 0) {
        return nextStart;
      }
      return undefined;
    },
    enabled: queryMaxHeight > 0,
  });

  const isLoading =
    (isLedgerLoading && frozenMaxHeight === 0) ||
    (isBlocksLoading && queryMaxHeight > 0);

  const handleRefresh = () => {
    setFrozenMaxHeight(latestMaxHeight);
  };

  // Flatten data
  const flatBlocks = data?.pages.flatMap((page) => page) ?? [];

  const isRefreshing = isFetching && !isFetchingNextPage;

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
                ? Array.from({ length: BLOCKS_COUNT }).map((_, i) => (
                    <TableRow key={i} className="h-16">
                      <TableCell colSpan={COLUMN_COUNT}>
                        <EnhancedSkeleton className="h-13 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : flatBlocks.map((block: Types.Block) => (
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

        {!isLoading && hasNextPage && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
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
