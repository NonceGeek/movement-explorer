"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGetIsGraphqlClientSupported } from "@/hooks/common/useGraphqlClient";
import { ArrowRight } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserTransactions } from "./components/UserTransactions";
import { AllTransactions } from "./components/AllTransactions";
import {
  TransactionTable,
  ALL_TRANSACTION_COLUMNS,
} from "@/components/transactions";

function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isGraphqlClientSupported = useGetIsGraphqlClientSupported();

  // Determine the initial type based on URL or graphql support
  const typeParam = searchParams.get("type");
  const [isUserTransactions, setIsUserTransactions] = useState<boolean | null>(
    null,
  );

  // Set initial type on mount
  useEffect(() => {
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
  }, [typeParam, isGraphqlClientSupported, router, searchParams]);

  const toggleTransactionType = () => {
    const params = new URLSearchParams();
    if (isUserTransactions) {
      params.set("type", "all");
    } else {
      params.set("type", "user");
    }
    router.push(`/transactions?${params.toString()}`);
    setIsUserTransactions(!isUserTransactions);
  };

  // Show skeleton while determining the type
  if (isUserTransactions === null) {
    return (
      <div className="overflow-x-auto mt-[60px]">
        <TransactionTable
          data={[]}
          columns={ALL_TRANSACTION_COLUMNS}
          isLoading={true}
          loadingRowCount={20}
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
      className="text-guild-green-500 hover:text-guild-green-400 gap-1.5"
    >
      {isUserTransactions ? "View All Txn" : "View User Txn"}
      <ArrowRight size={20} strokeWidth={2.5} />
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
      <PageNavigation title="Transactions" />
      <div className="container mx-auto px-4 py-8 max-w-[1440px]">
        <Suspense
          fallback={
            <div className="overflow-x-auto mt-[60px]">
              <TransactionTable
                data={[]}
                columns={ALL_TRANSACTION_COLUMNS}
                isLoading={true}
                loadingRowCount={20}
                timestampMode="age"
                onToggleTimestampMode={() => { }}
              />
            </div>
          }
        >
          <TransactionsContent />
        </Suspense>
      </div>
    </>
  );
}
