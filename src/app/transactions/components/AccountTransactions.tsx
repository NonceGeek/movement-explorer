"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  useTransactionPaginationStore,
  PageSize,
  DEFAULT_PAGE_SIZE,
} from "@/store/useTransactionPaginationStore";
import { useGetAccountTransactionVersions } from "@/hooks/accounts/useGetAccountTransactionVersions";
import { useGetAccountTransactionCount } from "@/hooks/accounts/useGetAccountTransactionCount";
import { useStreamingTransactions } from "@/hooks/transactions/useStreamingTransactions";
import {
  TransactionTable,
  ACCOUNT_TRANSACTION_COLUMNS,
  TransactionTableToolbar,
  TransactionTableFooter,
  ColumnFilters,
} from "@/components/transactions";
import {
  DateRangeColumnFilter,
  DateRange,
} from "@/components/transactions/filters/DateRangeFilter";
import { AddressColumnFilter } from "@/components/transactions/filters/AddressColumnFilter";
import { TableLoadingBar } from "@/components/common/TableLoadingBar";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { ArrowLeft, X } from "lucide-react";

const MAX_PAGES = 100;

interface AccountTransactionsProps {
  address: string;
  headerEndDecorator?: React.ReactNode;
}

export function AccountTransactions({
  address,
  headerEndDecorator,
}: AccountTransactionsProps) {
  const { aptos_client, network_value } = useGlobalStore();
  const { pageSize, setPageSize } = useTransactionPaginationStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [senderFilter, setSenderFilter] = useState<string | null>(null);

  // Get page from URL or default to 1, capped at MAX_PAGES
  const pageParam = searchParams.get("page");
  const currentPage = Math.min(
    MAX_PAGES,
    pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1,
  );

  // Get limit from URL or use store value
  const limitParam = searchParams.get("limit");
  const currentLimit: PageSize = limitParam
    ? ((parseInt(limitParam) as PageSize) || DEFAULT_PAGE_SIZE)
    : pageSize;

  // Fetch transaction count
  const { data: txCount } = useGetAccountTransactionCount(address);
  const totalCount = txCount ?? 0;
  const totalPages = Math.min(
    MAX_PAGES,
    Math.max(1, Math.ceil(totalCount / currentLimit)),
  );

  // Fetch transaction versions for current page
  const offset = (currentPage - 1) * currentLimit;
  const { data: transactionVersions, isLoading: versionsLoading } =
    useGetAccountTransactionVersions(address, currentLimit, offset, dateRange.from, dateRange.to, senderFilter);

  // Stream transaction details as they resolve
  const {
    rows: tableData,
    isStreaming,
  } = useStreamingTransactions(
    transactionVersions && transactionVersions.length > 0 ? transactionVersions : undefined,
    aptos_client,
    true,
    network_value,
  );

  // Only loaded rows (for toolbar/download — excludes skeleton placeholders)
  const loadedRows = tableData.filter((r) => r.transaction !== null) as import("@/components/transactions").TransactionRowData[];

  const isLoading = versionsLoading && tableData.length === 0;

  // URL sync handlers
  const updateURL = useCallback(
    (page: number, limit: PageSize) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      router.push(`/transactions?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1) {
        updateURL(page, currentLimit);
      }
    },
    [currentLimit, updateURL],
  );

  const handlePageSizeChange = useCallback(
    (size: PageSize) => {
      setPageSize(size);
      updateURL(1, size);
    },
    [setPageSize, updateURL],
  );

  // Reset to page 1 when filters change
  const filterKey = `${dateRange.from}-${dateRange.to}-${senderFilter}`;
  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      if (currentPage !== 1) {
        handlePageChange(1);
      }
    }
  }, [filterKey, currentPage, handlePageChange]);

  const hasActiveFilters = dateRange.from !== null || senderFilter !== null;

  const clearAllFilters = () => {
    setDateRange({ from: null, to: null });
    setSenderFilter(null);
  };

  const columnFilters: ColumnFilters = {
    timestamp: (
      <DateRangeColumnFilter
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        timestampMode={timestampMode}
        onToggleTimestampMode={setTimestampMode}
      />
    ),
    sender: (
      <AddressColumnFilter
        label="Sender"
        value={senderFilter}
        onChange={setSenderFilter}
      />
    ),
  };

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/account/${address}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold">
            Account Transactions
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-1 ml-8">
          <CopyableAddress
            address={address}
            showCopyButton
            variant="muted"
          />
        </div>
        {headerEndDecorator}
      </div>

      {/* Top Toolbar */}
      <TransactionTableToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        transactions={loadedRows}
        isLoading={isLoading}
        infoText={
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <span>
                <span className="font-medium text-foreground">
                  {totalCount.toLocaleString()}
                </span>{" "}
                transactions found
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full cursor-pointer hover:bg-primary/20 transition-colors"
              >
                <X className="h-3 w-3" />
                filtered
              </button>
            )}
          </div>
        }
      />

      {/* Table */}
      <div className="relative overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <TableLoadingBar visible={isStreaming && !isLoading} />
        <TransactionTable
          data={tableData}
          columns={ACCOUNT_TRANSACTION_COLUMNS}
          isLoading={isLoading}
          loadingRowCount={currentLimit}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
          address={address}
          columnFilters={columnFilters}
        />
      </div>

      {/* Bottom Footer */}
      <TransactionTableFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        pageSize={currentLimit}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />
    </>
  );
}
