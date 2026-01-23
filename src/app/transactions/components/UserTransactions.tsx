import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import useGetUserTransactionVersions from "@/hooks/transactions/useGetUserTransactionVersions";
import { TransactionTypeTooltip } from "@/components/common/TransactionTypeTooltip";
import { UserTransactionRow } from "./UserTransactionRow";

const LIMIT = 20;
const NUM_PAGES = 100;

export function UserTransactions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get("page") ?? "1");
  const offset = (currentPage - 1) * LIMIT;

  // Timestamp display mode: "age" (default) or "dateTime"
  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  const startVersion = useGetUserTransactionVersions(1)[0];
  const versions = useGetUserTransactionVersions(LIMIT, startVersion, offset);

  const isLoading = versions.length === 0;

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

  if (isLoading) {
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
                <div className="inline-flex items-center bg-muted/30 rounded-md p-0.5 border border-border/50">
                  <button
                    onClick={() => setTimestampMode("age")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                      timestampMode === "age"
                        ? "bg-guild-green-500 text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    Age
                  </button>
                  <button
                    onClick={() => setTimestampMode("dateTime")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                      timestampMode === "dateTime"
                        ? "bg-guild-green-500 text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    UTC
                  </button>
                </div>
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
            {versions.map((version) => (
              <UserTransactionRow
                key={version}
                version={version}
                timestampMode={timestampMode}
                className="animate-in slide-in-from-top-2 fade-in duration-500"
              />
            ))}
          </TableBody>
        </StyledTable>
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
              ),
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
