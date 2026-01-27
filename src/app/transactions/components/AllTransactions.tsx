import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Types } from "aptos";
import { Loader2 } from "lucide-react";
import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  TableBody,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransactions, getLedgerInfo } from "@/services";
import { TransactionTypeTooltip } from "@/components/common/TransactionTypeTooltip";
import { AllTransactionRow } from "./AllTransactionRow";
import { TimestampModeToggle } from "@/components/common/TimestampModeToggle";

const LIMIT = 20;

export function AllTransactions() {
  const { aptos_client, network_value } = useGlobalStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Timestamp display mode: "age" (default) or "dateTime"
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  const startParam = searchParams.get("start");

  // Fetch ledger info to get max version
  const { data: ledgerInfo } = useQuery({
    queryKey: ["ledgerInfo", network_value],
    queryFn: () => getLedgerInfo(aptos_client),
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <StyledTable>
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead>Transaction Hash</StyledTableHead>
              <StyledTableHead className="flex items-center">
                Type
                <TransactionTypeTooltip />
              </StyledTableHead>
              <StyledTableHead>
                <TimestampModeToggle
                  mode={timestampMode}
                  setMode={setTimestampMode}
                />
              </StyledTableHead>
              <StyledTableHead>Sender</StyledTableHead>
              <StyledTableHead className="hidden md:table-cell">
                To
              </StyledTableHead>
              <StyledTableHead className="hidden sm:table-cell">
                Function
              </StyledTableHead>
              <StyledTableHead className="hidden lg:table-cell text-right">
                Amount
              </StyledTableHead>
              <StyledTableHead className="hidden lg:table-cell text-right">
                Gas
              </StyledTableHead>
            </StyledTableHeaderRow>
          </StyledTableHeader>
          <TableBody>
            {transactions.map((tx: Types.Transaction) => (
              <AllTransactionRow
                key={tx.hash}
                transaction={tx}
                timestampMode={timestampMode}
                onToggleTimestampMode={() =>
                  setTimestampMode((prev) =>
                    prev === "age" ? "dateTime" : "age",
                  )
                }
                className="animate-in slide-in-from-top-2 fade-in duration-500"
              />
            ))}
          </TableBody>
        </StyledTable>
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
                ),
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
