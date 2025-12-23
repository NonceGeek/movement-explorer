"use client";

import { useGetMostRecentBlocks } from "@/hooks/blocks/useGetMostRecentBlocks";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Types } from "aptos";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getLedgerInfo } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const BLOCKS_COUNT = 25;

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

function BlocksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { aptos_client, network_value } = useGlobalStore();

  const startParam = searchParams.get("start");

  // Fetch ledger info to get latest block height
  const { data: ledgerInfo } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: 10000,
  });

  const latestBlockHeight = ledgerInfo ? parseInt(ledgerInfo.block_height) : 0;

  // Calculate start block height
  let startBlockHeight: string | undefined = undefined;
  if (startParam) {
    startBlockHeight = startParam;
  }

  const { recentBlocks, isLoading } = useGetMostRecentBlocks(
    startBlockHeight,
    BLOCKS_COUNT
  );

  // Get current page from the first block in the list
  const firstBlockInList =
    recentBlocks.length > 0
      ? parseInt(recentBlocks[0].block_height)
      : latestBlockHeight;

  // Pagination calculations
  const totalPages = Math.ceil(latestBlockHeight / BLOCKS_COUNT);
  const currentPage = Math.max(
    1,
    Math.ceil((latestBlockHeight - firstBlockInList + 1) / BLOCKS_COUNT)
  );

  const handlePageChange = (page: number) => {
    if (page === 1) {
      router.push("/blocks");
    } else {
      const newStart = Math.max(
        0,
        latestBlockHeight - (page - 1) * BLOCKS_COUNT
      );
      router.push(`/blocks?start=${newStart}`);
    }
  };

  // Generate page numbers to show
  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    const showPages = 5;
    const halfShow = Math.floor(showPages / 2);

    let startPage = Math.max(1, currentPage - halfShow);
    let endPage = Math.min(totalPages, currentPage + halfShow);

    if (currentPage <= halfShow) {
      endPage = Math.min(totalPages, showPages);
    } else if (currentPage >= totalPages - halfShow) {
      startPage = Math.max(1, totalPages - showPages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("ellipsis");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Latest Blocks</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Recent Blocks</span>
            {latestBlockHeight > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                Latest block: {latestBlockHeight.toLocaleString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Block</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Hash</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">
                        First Version
                      </TableHead>
                      <TableHead className="text-right">Last Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBlocks.map((block: Types.Block) => (
                      <TableRow key={block.block_height}>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1)
                              handlePageChange(currentPage - 1);
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {getVisiblePages().map((page, i) =>
                        page === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${i}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page);
                              }}
                              isActive={page === currentPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages)
                              handlePageChange(currentPage + 1);
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BlocksPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Latest Blocks</h1>
          <Card>
            <CardHeader>
              <CardTitle>Recent Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <BlocksContent />
    </Suspense>
  );
}
