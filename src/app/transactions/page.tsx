"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGetIsGraphqlClientSupported } from "@/hooks/common/useGraphqlClient";
import { ArrowRight } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserTransactions } from "./components/UserTransactions";
import { AllTransactions } from "./components/AllTransactions";
import { BlockTransactions } from "./components/BlockTransactions";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
} from "@/components/transactions";
import { DEFAULT_PAGE_SIZE } from "@/store/useTransactionPaginationStore";

function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isGraphqlClientSupported = useGetIsGraphqlClientSupported();

  // Check for block filter
  const blockParam = searchParams.get("block");
  const blockHeight = blockParam ? parseInt(blockParam) : null;
  const isBlockFilter = blockHeight !== null && !isNaN(blockHeight);

  // Determine the initial type based on URL or graphql support
  const typeParam = searchParams.get("type");
  const [isUserTransactions, setIsUserTransactions] = useState<boolean | null>(
    null,
  );

  // Set initial type on mount
  useEffect(() => {
    if (isBlockFilter) return;
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
  }, [typeParam, isGraphqlClientSupported, router, searchParams, isBlockFilter]);

  const toggleTransactionType = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isUserTransactions) {
      params.set("type", "all");
    } else {
      params.set("type", "user");
    }
    // Reset to page 1 when switching types, but keep limit
    params.set("page", "1");
    router.push(`/transactions?${params.toString()}`);
    setIsUserTransactions(!isUserTransactions);
  };

  // Block filter mode
  if (isBlockFilter) {
    const clearBlockFilter = (
      <Button
        variant="link"
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("block");
          params.set("type", "all");
          params.set("page", "1");
          router.push(`/transactions?${params.toString()}`);
        }}
        className="text-guild-green-500 hover:text-guild-green-400 gap-1 h-auto p-0 text-xs sm:text-sm sm:font-bold"
      >
        View All Txn
        <ArrowRight size={14} strokeWidth={2.5} className="sm:size-4" />
      </Button>
    );
    return (
      <BlockTransactions
        blockHeight={blockHeight}
        headerEndDecorator={clearBlockFilter}
      />
    );
  }

  // Show skeleton while determining the type
  if (isUserTransactions === null) {
    return (
      <div className="overflow-x-auto mt-[60px]">
        <TransactionTable
          data={[]}
          columns={ALL_TRANSACTION_COLUMNS}
          isLoading={true}
          loadingRowCount={DEFAULT_PAGE_SIZE}
          timestampMode="age"
          onToggleTimestampMode={() => { }}
        />
      </div>
    );
  }

  const headerEndDecorator = isGraphqlClientSupported ? (
    <Button
      variant="link"
      onClick={toggleTransactionType}
      className="text-guild-green-500 hover:text-guild-green-400 gap-1 h-auto p-0 text-xs sm:text-sm sm:font-bold"
    >
      {isUserTransactions ? "View All Txn" : "View User Txn"}
      <ArrowRight size={14} strokeWidth={2.5} className="sm:size-4" />
    </Button>
  ) : null;

  return (
    <>
      {isUserTransactions ? (
        <UserTransactions headerEndDecorator={headerEndDecorator} />
      ) : (
        <AllTransactions headerEndDecorator={headerEndDecorator} />
      )}
    </>
  );
}

export default function TransactionsPage() {
  return (
    <>
      <PageNavigation />
      <PageContainer>
        <Suspense
          fallback={
            <div className="overflow-x-auto mt-[60px]">
              <TransactionTable
                data={[]}
                columns={ALL_TRANSACTION_COLUMNS}
                isLoading={true}
                loadingRowCount={DEFAULT_PAGE_SIZE}
                timestampMode="age"
                onToggleTimestampMode={() => { }}
              />
            </div>
          }
        >
          <TransactionsContent />
        </Suspense>
      </PageContainer>
    </>
  );
}
