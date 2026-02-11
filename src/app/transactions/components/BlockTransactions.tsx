"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Types } from "aptos";
import { useGetBlockByHeight } from "@/hooks/blocks/useGetBlock";
import {
  useTransactionPaginationStore,
  PageSize,
  DEFAULT_PAGE_SIZE,
} from "@/store/useTransactionPaginationStore";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
  TransactionRowData,
  TransactionTableToolbar,
  TransactionTableFooter,
} from "@/components/transactions";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface BlockTransactionsProps {
  blockHeight: number;
  headerEndDecorator?: React.ReactNode;
}

export function BlockTransactions({
  blockHeight,
  headerEndDecorator,
}: BlockTransactionsProps) {
  const { pageSize, setPageSize } = useTransactionPaginationStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  // Get page from URL or default to 1
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1;

  // Get limit from URL or use store value
  const limitParam = searchParams.get("limit");
  const currentLimit: PageSize = limitParam
    ? (parseInt(limitParam) as PageSize) || DEFAULT_PAGE_SIZE
    : pageSize;

  // Fetch block with transactions
  const {
    data: block,
    isLoading,
    error,
  } = useGetBlockByHeight({
    height: blockHeight,
    withTransactions: true,
  });

  // Transform block transactions to table data
  const allTableData: TransactionRowData[] = (block?.transactions ?? []).map(
    (tx) => {
      const version = "version" in tx ? parseInt(String(tx.version)) : 0;
      return { version, transaction: tx as unknown as Types.Transaction };
    }
  );

  const totalCount = allTableData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentLimit));

  // Client-side pagination
  const startIdx = (currentPage - 1) * currentLimit;
  const pageData = allTableData.slice(startIdx, startIdx + currentLimit);

  // URL sync handlers
  const updateURL = useCallback(
    (page: number, limit: PageSize) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      router.push(`/transactions?${params.toString()}`, { scroll: false });
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
      updateURL(1, size);
    },
    [setPageSize, updateURL]
  );

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">
            Failed to load transactions for block {blockHeight}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <EnhancedSkeleton className="h-10 w-64" />
        <EnhancedSkeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/block/${blockHeight}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold">
            Block #{blockHeight} Transactions
          </h1>
        </div>
        {headerEndDecorator}
      </div>

      {/* Top Toolbar */}
      <TransactionTableToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        transactions={pageData}
        isLoading={false}
        infoText={
          <>
            <span className="font-medium text-foreground">
              {totalCount.toLocaleString()}
            </span>{" "}
            transactions found in Block #{blockHeight}
          </>
        }
      />

      {/* Table */}
      <div className="relative overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <TransactionTable
          data={pageData}
          columns={ALL_TRANSACTION_COLUMNS}
          isLoading={false}
          loadingRowCount={currentLimit}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
        />
      </div>

      {/* Bottom Footer */}
      <TransactionTableFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        pageSize={currentLimit}
        onPageSizeChange={handlePageSizeChange}
        isLoading={false}
      />
    </>
  );
}
