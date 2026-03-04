"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  useTransactionPaginationStore,
  PageSize,
  DEFAULT_PAGE_SIZE,
} from "@/store/useTransactionPaginationStore";
import { useGetAccountCoinTransfers } from "@/hooks/accounts/useGetAccountCoinTransfers";
import { useGetAccountCoinTransfersCount } from "@/hooks/accounts/useGetAccountCoinTransfersCount";
import {
  TransactionTable,
  TOKEN_TRANSFER_COLUMNS,
  TransactionRowData,
} from "@/components/transactions";
import { TransactionTableToolbar } from "@/components/transactions/TransactionTableToolbar";
import { TransactionTableFooter } from "@/components/transactions/TransactionTableFooter";
import { TableLoadingBar } from "@/components/common/TableLoadingBar";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { ArrowLeft } from "lucide-react";

const MAX_PAGES = 100;

interface AccountCoinTransfersProps {
  address: string;
  headerEndDecorator?: React.ReactNode;
}

export function AccountCoinTransfers({
  address,
  headerEndDecorator,
}: AccountCoinTransfersProps) {
  const { pageSize, setPageSize } = useTransactionPaginationStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

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

  // Get optional coinType filter from URL
  const coinTypeParam = searchParams.get("coinType");

  // Fetch count
  const { data: txCount } = useGetAccountCoinTransfersCount(
    address,
    coinTypeParam,
  );
  const totalCount = txCount ?? 0;
  const totalPages = Math.min(
    MAX_PAGES,
    Math.max(1, Math.ceil(totalCount / currentLimit)),
  );

  // Fetch coin transfer versions for current page
  const offset = (currentPage - 1) * currentLimit;
  const { data: transactionVersions, isLoading: versionsLoading } =
    useGetAccountCoinTransfers(address, currentLimit, offset, coinTypeParam);

  // Fetch full transaction details
  const { aptos_client } = useGlobalStore();
  const { data: transactions, isLoading: detailsLoading } = useQuery({
    queryKey: [
      "accountCoinTransferDetails",
      address,
      transactionVersions,
    ],
    queryFn: async () => {
      if (!transactionVersions || transactionVersions.length === 0) return [];
      return Promise.all(
        transactionVersions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client),
        ),
      );
    },
    enabled: !!transactionVersions && transactionVersions.length > 0,
  });

  const isLoading = versionsLoading || detailsLoading;

  const tableData: TransactionRowData[] = (transactions || []).map((tx) => {
    const version = "version" in tx ? parseInt(tx.version) : 0;
    return { version, transaction: tx };
  });

  // URL sync handlers
  const updateURL = useCallback(
    (page: number, limit: PageSize) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
            Token Transfers
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
        transactions={[]}
        isLoading={isLoading}
        infoText={
          totalCount > 0 ? (
            <>
              <span className="font-medium text-foreground">
                {totalCount.toLocaleString()}
              </span>{" "}
              token transfers found
            </>
          ) : undefined
        }
      />

      {/* Table */}
      <div className="relative overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <TableLoadingBar visible={!isLoading && !!transactions} />
        <TransactionTable
          data={tableData}
          columns={TOKEN_TRANSFER_COLUMNS}
          isLoading={isLoading}
          loadingRowCount={currentLimit}
          timestampMode={timestampMode}
          onToggleTimestampMode={() =>
            setTimestampMode((prev) => (prev === "age" ? "dateTime" : "age"))
          }
          address={address}
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
