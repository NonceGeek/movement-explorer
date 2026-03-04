"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AccountCoinTransfers } from "@/app/transactions/components/AccountCoinTransfers";
import {
  TransactionTable,
  TOKEN_TRANSFER_COLUMNS,
} from "@/components/transactions";
import { DEFAULT_PAGE_SIZE } from "@/store/useTransactionPaginationStore";

function TokenTransactionsContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address");

  if (!address) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No address specified. Please provide an address parameter.
      </div>
    );
  }

  return <AccountCoinTransfers address={address} />;
}

export default function TokenTransactionsPage() {
  return (
    <>
      <PageNavigation />
      <PageContainer>
        <Suspense
          fallback={
            <div className="overflow-x-auto mt-[60px]">
              <TransactionTable
                data={[]}
                columns={TOKEN_TRANSFER_COLUMNS}
                isLoading={true}
                loadingRowCount={DEFAULT_PAGE_SIZE}
                timestampMode="age"
                onToggleTimestampMode={() => {}}
              />
            </div>
          }
        >
          <TokenTransactionsContent />
        </Suspense>
      </PageContainer>
    </>
  );
}
