"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useGetTokenActivities,
  useGetTokenActivitiesCount,
} from "@/hooks/tokens/useGetTokenData";
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
import { Activity } from "lucide-react";
import { useVisiblePages } from "./useVisiblePages";

const ACTIVITIES_LIMIT = 20;

export function ActivitiesTab({ tokenId }: { tokenId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentPage = parseInt(searchParams.get("actPage") ?? "1", 10);
  const offset = (currentPage - 1) * ACTIVITIES_LIMIT;

  const { count: activitiesCount, isLoading: countLoading } =
    useGetTokenActivitiesCount(tokenId);
  const { data: activities, isLoading: activitiesLoading } =
    useGetTokenActivities(tokenId, ACTIVITIES_LIMIT, offset);

  const totalPages = Math.max(1, Math.ceil(activitiesCount / ACTIVITIES_LIMIT));
  const visiblePages = useVisiblePages(currentPage, totalPages);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("actPage", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (!countLoading && activitiesCount === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No activities found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {activitiesLoading ? (
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
                  <TableHead>Transaction</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Property Version</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </HeaderRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity, idx) => (
                  <TableRow key={`${activity.transaction_version}-${idx}`}>
                    <TableCell>
                      <Link
                        href={`/txn/${activity.transaction_version}`}
                        className="text-primary hover:underline font-mono"
                      >
                        {activity.transaction_version}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {activity.from_address ? (
                        <Link
                          href={`/account/${activity.from_address}`}
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {activity.from_address.slice(0, 6)}...
                          {activity.from_address.slice(-4)}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.to_address ? (
                        <Link
                          href={`/account/${activity.to_address}`}
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {activity.to_address.slice(0, 6)}...
                          {activity.to_address.slice(-4)}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {activity.property_version_v1 ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {activity.token_amount ?? "-"}
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
                        if (currentPage > 1) handlePageChange(currentPage - 1);
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
        </div>
      )}
    </>
  );
}
