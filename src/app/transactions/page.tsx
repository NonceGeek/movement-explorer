"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useQuery } from "@tanstack/react-query";
import { getTransactions, getLedgerInfo } from "@/services";
import { useGlobalStore } from "@/store/useGlobalStore";
import Link from "next/link";
import { Types } from "aptos";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useGetIsGraphqlClientSupported } from "@/hooks/common/useGraphqlClient";
import useGetUserTransactionVersions from "@/hooks/transactions/useGetUserTransactionVersions";
import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";
import {
  getTransactionCounterparty,
  getTransactionAmount,
  getTransactionFunction,
  formatMoveAmount,
} from "@/utils/transaction";
import { FileText, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LIMIT = 20;
const NUM_PAGES = 100;

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

function getSender(tx: Types.Transaction): string | null {
  if (tx.type === "user_transaction" && "sender" in tx) {
    return (tx as Types.UserTransaction).sender;
  }
  if (tx.type === "block_metadata_transaction" && "proposer" in tx) {
    return (tx as Types.BlockMetadataTransaction).proposer;
  }
  return null;
}

// User Transaction Row Component - fetches transaction details by version
function UserTransactionRow({ version }: { version: number }) {
  const {
    data: transaction,
    isError,
    isLoading,
  } = useGetTransaction(version.toString());

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={8}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!transaction || isError) {
    return null;
  }

  const status = "success" in transaction ? transaction.success : true;
  const sender = getSender(transaction);
  const timestamp = "timestamp" in transaction ? transaction.timestamp : null;
  const counterparty = getTransactionCounterparty(transaction);
  const amount = getTransactionAmount(transaction);
  const functionName = getTransactionFunction(transaction);
  const gasUsed = "gas_used" in transaction ? transaction.gas_used : null;
  const gasUnitPrice =
    "gas_unit_price" in transaction ? transaction.gas_unit_price : null;

  return (
    <TableRow>
      {/* Version + Status */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Link
            href={`/txn/${version}`}
            className="text-primary hover:underline font-mono"
          >
            {version}
          </Link>
          {status ? (
            <Badge variant="success" className="gap-1 pl-1.5">
              <CheckCircle2 className="h-3 w-3" /> Success
            </Badge>
          ) : (
            <Badge variant="error" className="gap-1 pl-1.5">
              <XCircle className="h-3 w-3" /> Failed
            </Badge>
          )}
        </div>
      </TableCell>
      {/* Type */}
      <TableCell>
        <Badge variant="secondary" className="capitalize text-xs">
          {getTransactionType(transaction)}
        </Badge>
      </TableCell>
      {/* Timestamp */}
      <TableCell className="text-muted-foreground text-sm">
        {timestamp ? formatTimestamp(timestamp) : "-"}
      </TableCell>
      {/* Sender */}
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
      {/* Receiver */}
      <TableCell>
        {counterparty ? (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {counterparty.role === "smartContract" ? (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {counterparty.role === "smartContract"
                    ? "Smart Contract"
                    : "Receiver"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Link
              href={`/account/${counterparty.address}`}
              className="text-primary hover:underline font-mono text-sm"
            >
              {counterparty.address.slice(0, 8)}...
              {counterparty.address.slice(-6)}
            </Link>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {/* Function */}
      <TableCell>
        {functionName ? (
          <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
            {functionName}
          </code>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {/* Amount + Gas */}
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          {amount !== undefined && amount > 0 ? (
            <span className="font-mono">{formatMoveAmount(amount)} MOVE</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          {gasUsed && gasUnitPrice && (
            <span className="text-xs text-muted-foreground">
              Gas {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// User Transactions Component
function UserTransactions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get("page") ?? "1");
  const offset = (currentPage - 1) * LIMIT;

  const startVersion = useGetUserTransactionVersions(1)[0];
  const versions = useGetUserTransactionVersions(LIMIT, startVersion, offset);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", "user");
    params.set("page", page.toString());
    router.push(`/transactions?${params.toString()}`);
  };

  // Generate page numbers to show
  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    const showPages = 5;
    const halfShow = Math.floor(showPages / 2);

    let startPage = Math.max(1, currentPage - halfShow);
    let endPage = Math.min(NUM_PAGES, currentPage + halfShow);

    if (currentPage <= halfShow) {
      endPage = Math.min(NUM_PAGES, showPages);
    } else if (currentPage >= NUM_PAGES - halfShow) {
      startPage = Math.max(1, NUM_PAGES - showPages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("ellipsis");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < NUM_PAGES) {
      if (endPage < NUM_PAGES - 1) pages.push("ellipsis");
      pages.push(NUM_PAGES);
    }

    return pages;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Function</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex justify-center py-8">
                    <Skeleton className="h-8 w-full max-w-md" />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              versions.map((version) => (
                <UserTransactionRow key={version} version={version} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) handlePageChange(currentPage - 1);
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
                  if (currentPage < NUM_PAGES)
                    handlePageChange(currentPage + 1);
                }}
                className={
                  currentPage === NUM_PAGES
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}

// All Transaction Row Component
function AllTransactionRow({
  transaction,
}: {
  transaction: Types.Transaction;
}) {
  const status = "success" in transaction ? transaction.success : true;
  const sender = getSender(transaction);
  const version = "version" in transaction ? transaction.version : null;
  const timestamp = "timestamp" in transaction ? transaction.timestamp : null;
  const counterparty = getTransactionCounterparty(transaction);
  const amount = getTransactionAmount(transaction);
  const functionName = getTransactionFunction(transaction);
  const gasUsed = "gas_used" in transaction ? transaction.gas_used : null;
  const gasUnitPrice =
    "gas_unit_price" in transaction ? transaction.gas_unit_price : null;

  return (
    <TableRow>
      {/* Version + Status */}
      <TableCell>
        <div className="flex items-center gap-2">
          {version && (
            <Link
              href={`/txn/${version}`}
              className="text-primary hover:underline font-mono"
            >
              {version}
            </Link>
          )}
          {status ? (
            <Badge variant="success" className="gap-1 pl-1.5">
              <CheckCircle2 className="h-3 w-3" /> Success
            </Badge>
          ) : (
            <Badge variant="error" className="gap-1 pl-1.5">
              <XCircle className="h-3 w-3" /> Failed
            </Badge>
          )}
        </div>
      </TableCell>
      {/* Type */}
      <TableCell>
        <Badge variant="secondary" className="capitalize text-xs">
          {getTransactionType(transaction)}
        </Badge>
      </TableCell>
      {/* Timestamp */}
      <TableCell className="text-muted-foreground text-sm">
        {timestamp ? formatTimestamp(timestamp) : "-"}
      </TableCell>
      {/* Sender */}
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
      {/* Receiver */}
      <TableCell>
        {counterparty ? (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {counterparty.role === "smartContract" ? (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {counterparty.role === "smartContract"
                    ? "Smart Contract"
                    : "Receiver"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Link
              href={`/account/${counterparty.address}`}
              className="text-primary hover:underline font-mono text-sm"
            >
              {counterparty.address.slice(0, 8)}...
              {counterparty.address.slice(-6)}
            </Link>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {/* Function */}
      <TableCell>
        {functionName ? (
          <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
            {functionName}
          </code>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {/* Amount + Gas */}
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          {amount !== undefined && amount > 0 ? (
            <span className="font-mono">{formatMoveAmount(amount)} MOVE</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          {gasUsed && gasUnitPrice && (
            <span className="text-xs text-muted-foreground">
              Gas {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// All Transactions Component
function AllTransactions() {
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
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", "all");
    params.set("start", newStart.toString());
    router.push(`/transactions?${params.toString()}`);
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

  if (isLoading || !transactions) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Function</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx: Types.Transaction) => (
              <AllTransactionRow key={tx.hash} transaction={tx} />
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
                    if (currentPage > 1) handlePageChange(currentPage - 1);
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
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isGraphqlClientSupported = useGetIsGraphqlClientSupported();

  // Determine the initial type based on URL or graphql support
  const typeParam = searchParams.get("type");
  const [isUserTransactions, setIsUserTransactions] = useState<boolean | null>(
    null
  );

  // Set initial type on mount
  useEffect(() => {
    if (typeParam === "all") {
      setIsUserTransactions(false);
    } else if (typeParam === "user") {
      setIsUserTransactions(true);
    } else {
      // Default based on graphql support
      setIsUserTransactions(isGraphqlClientSupported);
      // Update URL to reflect the default
      const params = new URLSearchParams(searchParams.toString());
      params.set("type", isGraphqlClientSupported ? "user" : "all");
      router.replace(`/transactions?${params.toString()}`);
    }
  }, [typeParam, isGraphqlClientSupported, router, searchParams]);

  const toggleTransactionType = () => {
    const params = new URLSearchParams();
    if (isUserTransactions) {
      params.set("type", "all");
    } else {
      params.set("type", "user");
    }
    router.push(`/transactions?${params.toString()}`);
    setIsUserTransactions(!isUserTransactions);
  };

  // Show loading while determining the type
  if (isUserTransactions === null) {
    return (
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
    );
  }

  return (
    <>
      <PageNavigation title="Transactions" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {isUserTransactions ? "User Transactions" : "All Transactions"}
          </h1>
          {isGraphqlClientSupported && (
            <Button variant="ghost" onClick={toggleTransactionType}>
              {isUserTransactions
                ? "View All Transactions"
                : "View User Transactions"}
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            {isUserTransactions ? <UserTransactions /> : <AllTransactions />}
          </CardContent>
        </Card>
      </div>
    </>
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
