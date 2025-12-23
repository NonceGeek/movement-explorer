"use client";

import { useQuery } from "@tanstack/react-query";
import { getTransactions, getLedgerInfo } from "@/services";
import { useGlobalStore } from "@/store/useGlobalStore";
import Link from "next/link";
import { Types } from "aptos";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

const LIMIT = 25;

function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) / 1000);
  return date.toLocaleString();
}

function getTransactionType(tx: Types.Transaction): string {
  return tx.type
    .replace(/_/g, " ")
    .replace(/transaction$/, "")
    .trim();
}

function getTransactionStatus(tx: Types.Transaction): {
  success: boolean;
  label: string;
} {
  if ("success" in tx) {
    return {
      success: tx.success,
      label: tx.success ? "Success" : "Failed",
    };
  }
  return { success: true, label: "Success" };
}

function getSender(tx: Types.Transaction): string | null {
  if (tx.type === "user_transaction" && "sender" in tx) {
    return (tx as Types.UserTransaction).sender;
  }
  if (tx.type === "block_metadata_transaction" && "proposer" in tx) {
    return (tx as Types.BlockMetadataTransaction).proposer;
  }
  return null;
}

function TransactionsContent() {
  const { aptos_client, network_value } = useGlobalStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const startParam = searchParams.get("start");

  // Fetch ledger info to get max version
  const { data: ledgerInfo } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
    refetchInterval: 10000,
  });

  const maxVersion = ledgerInfo ? parseInt(ledgerInfo.ledger_version) : 0;
  const maxStart = Math.max(0, maxVersion - LIMIT + 1);

  // Calculate start position
  let start = maxStart;
  if (startParam !== null) {
    start = Math.min(Math.max(0, parseInt(startParam)), maxStart);
  }

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", { start, limit: LIMIT }, network_value],
    queryFn: () => getTransactions({ start, limit: LIMIT }, aptos_client),
    enabled: maxVersion > 0,
  });

  // Pagination calculations
  const totalPages = Math.ceil(maxVersion / LIMIT);
  const currentPage = Math.max(1, Math.ceil((maxVersion - start) / LIMIT));

  const handlePageChange = (page: number) => {
    const newStart = Math.max(0, maxVersion - page * LIMIT + 1);
    router.push(`/transactions?start=${newStart}`);
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
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Recent Transactions</span>
            {maxVersion > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                Latest version: {maxVersion.toLocaleString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !transactions ? (
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
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: Types.Transaction) => {
                      const status = getTransactionStatus(tx);
                      const sender = getSender(tx);
                      const version = "version" in tx ? tx.version : null;
                      const timestamp = "timestamp" in tx ? tx.timestamp : null;

                      return (
                        <TableRow key={tx.hash}>
                          <TableCell>
                            {version && (
                              <Link
                                href={`/txn/${version}`}
                                className="text-primary hover:underline font-mono"
                              >
                                {version}
                              </Link>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                status.success ? "outline" : "destructive"
                              }
                              className={
                                status.success
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : ""
                              }
                            >
                              {status.success ? "✓" : "✗"} {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {getTransactionType(tx)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {timestamp ? formatTimestamp(timestamp) : "-"}
                          </TableCell>
                          <TableCell>
                            {sender ? (
                              <Link
                                href={`/account/${sender}`}
                                className="text-primary hover:underline font-mono text-sm"
                              >
                                {sender.slice(0, 8)}...{sender.slice(-6)}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/txn/${tx.hash}`}
                              className="text-primary hover:underline font-mono text-sm"
                            >
                              {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Transactions</h1>
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
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
      <TransactionsContent />
    </Suspense>
  );
}
