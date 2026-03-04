"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AccountNFTTransfers } from "@/app/transactions/components/AccountNFTTransfers";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_PAGE_SIZE } from "@/store/useTransactionPaginationStore";

function NFTTransfersContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address");

  if (!address) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No address specified. Please provide an address parameter.
      </div>
    );
  }

  return <AccountNFTTransfers address={address} />;
}

function NFTTransfersSkeleton() {
  return (
    <div className="overflow-x-auto mt-[60px]">
      <StyledTable>
        <StyledTableHeader>
          <StyledTableHeaderRow>
            <StyledTableHead className="w-[170px]">Txn Hash</StyledTableHead>
            <StyledTableHead className="w-[155px]">Age</StyledTableHead>
            <StyledTableHead className="w-[100px]">Activity</StyledTableHead>
            <StyledTableHead className="w-[180px]">Token</StyledTableHead>
            <StyledTableHead className="w-[150px]">From</StyledTableHead>
            <StyledTableHead className="w-[150px]">To</StyledTableHead>
            <StyledTableHead className="w-[80px] text-right">
              Amount
            </StyledTableHead>
          </StyledTableHeaderRow>
        </StyledTableHeader>
        <TableBody>
          {Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, i) => (
            <TableRow key={i} className="h-16">
              {Array.from({ length: 7 }).map((_, j) => (
                <TableCell key={j}>
                  <EnhancedSkeleton className="h-8 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </div>
  );
}

export default function NFTTransfersPage() {
  return (
    <>
      <PageNavigation />
      <PageContainer>
        <Suspense fallback={<NFTTransfersSkeleton />}>
          <NFTTransfersContent />
        </Suspense>
      </PageContainer>
    </>
  );
}
