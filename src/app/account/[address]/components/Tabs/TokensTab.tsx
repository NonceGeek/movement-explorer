"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useGetAccountTokens,
  useGetAccountTokensCount,
} from "@/hooks/accounts/useGetAccountTokens";
import {
  TableBody,
  TableCell,
  StyledTableRow as TableRow,
  StyledTable as Table,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "..";
import { Coins } from "lucide-react";

const LIMIT = 20;

interface TokensTabProps {
  address: string;
}

function useVisiblePages(currentPage: number, totalPages: number) {
  return useMemo(() => {
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
  }, [currentPage, totalPages]);
}

export default function TokensTab({ address }: TokensTabProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPage = parseInt(searchParams.get("tokenPage") ?? "1", 10);
  const offset = (currentPage - 1) * LIMIT;

  const { count: tokenCount, isLoading: countLoading } =
    useGetAccountTokensCount(address);

  const { data: tokens, isLoading: tokensLoading } = useGetAccountTokens(
    address,
    LIMIT,
    offset,
  );

  const totalPages = Math.max(1, Math.ceil(tokenCount / LIMIT));
  const visiblePages = useVisiblePages(currentPage, totalPages);

  const handlePageChange = (page: number) => {
    // Save current scroll position
    const scrollY = window.scrollY;

    const params = new URLSearchParams(searchParams.toString());
    params.set("tokenPage", page.toString());
    const newPath = `${pathname}?${params.toString()}`;

    // Use window.history.pushState to avoid Next.js navigation behavior
    window.history.pushState(null, '', newPath);

    // Restore scroll position after DOM update
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  if (!countLoading && tokenCount === 0) {
    return (
      <EmptyState
        icon={<Coins className="h-12 w-12" />}
        title="No Tokens Found"
        description="This account doesn't currently hold any tokens."
      />
    );
  }

  return (
    <>
      {tokensLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <HeaderRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Version</TableHead>
                  <TableHead className="text-right">Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </HeaderRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.token_data_id}>
                    <TableCell>
                      <Link
                        href={`/token/${encodeURIComponent(
                          token.token_data_id,
                        )}`}
                        className="text-primary hover:underline"
                      >
                        {token.current_token_data?.token_name || "-"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {token.current_token_data?.current_collection
                        ?.collection_name || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {token.table_type_v1 || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {token.property_version_v1 ?? "-"}
                    </TableCell>
                    <TableCell className="text-right uppercase">
                      {token.token_standard || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {token.amount ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
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

                  {visiblePages.map((page, i) =>
                    page === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
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
        </div>
      )}

    </>
  );
}
