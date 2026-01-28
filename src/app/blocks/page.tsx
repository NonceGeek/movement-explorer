"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Types } from "aptos";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { useGlobalStore } from "@/store/useGlobalStore";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getLedgerInfo, getRecentBlocks } from "@/services";
import { Button } from "@movementlabsxyz/movement-design-system";
import { Loader2 } from "lucide-react";
import { NewDataNotification } from "@/components/transactions";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BLOCKS_COUNT = 20;
const POLL_INTERVAL = 3000;

function getAgeInSeconds(blockTimestamp: string): string {
  const blockTime = parseInt(blockTimestamp) / 1000; // microseconds to milliseconds
  const now = Date.now();
  const ageSeconds = Math.floor((now - blockTime) / 1000);
  return ageSeconds.toString();
}

function getTransactionCount(block: Types.Block): string {
  return (
    BigInt(block.last_version) -
    BigInt(block.first_version) +
    BigInt(1)
  ).toString();
}

const variants = {
  initial: { backgroundColor: "rgba(34, 197, 94, 0.1)" },
  animate: { backgroundColor: "rgba(34, 197, 94, 0)" },
  exit: { opacity: 0 },
};

function BlocksContent() {
  const { aptos_client, network_value } = useGlobalStore();

  // State for manual refresh
  const [frozenMaxHeight, setFrozenMaxHeight] = useState<number>(0);
  const [highlightedBlocks, setHighlightedBlocks] = useState<Set<number>>(
    new Set(),
  );

  // Poll ledger info to detect new blocks
  const { data: ledgerInfo, isLoading: isLedgerLoading } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: POLL_INTERVAL,
  });

  const latestMaxHeight = ledgerInfo ? parseInt(ledgerInfo.block_height) : 0;

  // Initialize frozenMaxHeight once on first load
  useEffect(() => {
    if (frozenMaxHeight === 0 && latestMaxHeight > 0) {
      setFrozenMaxHeight(latestMaxHeight);
    }
  }, [latestMaxHeight, frozenMaxHeight]);

  // Calculate new blocks count
  const newCount =
    frozenMaxHeight > 0 ? Math.max(0, latestMaxHeight - frozenMaxHeight) : 0;

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
      // getRecentBlocks fetches 'count' blocks ending at 'currentBlockHeight' (descending)
      // So pageParam is the starting height (highest height for this page)
      return getRecentBlocks(pageParam, BLOCKS_COUNT, aptos_client);
    },
    initialPageParam: queryMaxHeight,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // If we don't have a stable anchor yet, don't paginate
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
    const newBlocksSet = new Set<number>();
    for (let h = frozenMaxHeight + 1; h <= latestMaxHeight; h++) {
      newBlocksSet.add(h);
    }

    setHighlightedBlocks(newBlocksSet);
    setFrozenMaxHeight(latestMaxHeight);

    setTimeout(() => {
      setHighlightedBlocks(new Set());
    }, 2500);
  };

  // Flatten data
  // Flatten data
  const flatBlocks = data?.pages.flatMap((page) => page) ?? [];

  const isRefreshing = isFetching && !isFetchingNextPage;

  return (
    <>
      <PageNavigation title="Blocks" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Blocks</h1>
          <NewDataNotification
            visible={newCount > 0}
            count={newCount}
            onClick={handleRefresh}
            isLoading={isRefreshing}
            dataType="blocks"
          />
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <EnhancedSkeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <StyledTable>
                <StyledTableHeader>
                  <StyledTableHeaderRow>
                    <StyledTableHead>Block</StyledTableHead>
                    <StyledTableHead>Age</StyledTableHead>
                    <StyledTableHead>Hash</StyledTableHead>
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
                  <AnimatePresence>
                    {flatBlocks.map((block: Types.Block) => {
                      const height = parseInt(block.block_height);
                      const isHighlighted = highlightedBlocks.has(height);

                      return (
                        <motion.tr
                          key={block.block_height}
                          initial={isHighlighted ? "initial" : false}
                          animate={isHighlighted ? "animate" : false}
                          variants={variants}
                          transition={{ duration: 2, ease: "easeOut" }}
                          className={cn(
                            "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                            // Also add a subtle green bg via class if preferred, but motion handles it
                          )}
                          style={{ height: "64px" }} // Match transaction table row height
                        >
                          <TableCell>
                            <Link
                              href={`/block/${block.block_height}`}
                              className="text-primary hover:underline font-mono"
                            >
                              {block.block_height}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {getAgeInSeconds(block.block_timestamp)}s ago
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {block.block_hash.slice(0, 10)}...
                              {block.block_hash.slice(-8)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {getTransactionCount(block)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/txn/${block.first_version}`}
                              className="text-primary hover:underline font-mono"
                            >
                              {block.first_version}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/txn/${block.last_version}`}
                              className="text-primary hover:underline font-mono"
                            >
                              {block.last_version}
                            </Link>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </StyledTable>
            </div>

            {hasNextPage && (
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
          </>
        )}
      </div>
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
