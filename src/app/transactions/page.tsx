"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGetIsGraphqlClientSupported } from "@/hooks/common/useGraphqlClient";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserTransactions } from "./components/UserTransactions";
import { AllTransactions } from "./components/AllTransactions";

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

  // Show loading while determining the type
  if (isUserTransactions === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isUserTransactions ? "User Transactions" : "All Transactions"}
        </h1>
        {isGraphqlClientSupported && (
          <Button variant="ghost" onClick={toggleTransactionType}>
            {isUserTransactions
              ? "View All Transactions"
              : "View User Transactions"}
          </Button>
        )}
      </div>

      {isUserTransactions ? <UserTransactions /> : <AllTransactions />}
    </>
  );
}

export default function TransactionsPage() {
  return (
    <>
      <PageNavigation title="Transactions" />
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <TransactionsContent />
        </Suspense>
      </div>
    </>
  );
}
