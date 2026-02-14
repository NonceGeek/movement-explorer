"use client";

import { useState, useMemo } from "react";
import {
  TableBody,
  StyledTable as Table,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
} from "@/components/ui/table";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCoinData } from "./coins/useCoinData";
import { CoinRow } from "./coins/CoinRow";
import { CoinFilters } from "./coins/CoinFilters";
import { EmptyState } from "..";
import { Wallet } from "lucide-react";

export default function CoinsTab({ address }: { address: string }) {
  const { filteredCoins, isLoading, filter, setFilter, totalUsdValue, coins } = useCoinData(address);
  const [hideLowValue, setHideLowValue] = useState(false);

  // Apply "Hide Low Value" filter (< $1)
  const displayedCoins = useMemo(() => {
    if (!hideLowValue) return filteredCoins;
    return filteredCoins.filter((coin) => (coin.usdValue ?? 0) >= 1);
  }, [filteredCoins, hideLowValue]);

  // Format total USD value
  const formattedTotalValue = totalUsdValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Show empty state only if user has no coins at all
  if (!isLoading && !coins.length) {
    return (
      <EmptyState
        icon={<Wallet className="h-12 w-12" />}
        title="No Coins Held"
        description="This account doesn't currently hold any coins."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Total Value and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Filters */}
        <CoinFilters filter={filter} setFilter={setFilter} />

        {/* Right: Total Value + Hide Low Value */}
        <div className="flex items-center gap-4">
          {/* Hide Low Value Toggle */}
          <Button
            variant={hideLowValue ? "default" : "outline"}
            size="sm"
            onClick={() => setHideLowValue(!hideLowValue)}
            className="text-xs"
          >
            {hideLowValue ? "✓ " : ""}Hide Low Value
          </Button>

          {/* Total Value */}
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Total Value: </span>
            {isLoading ? (
              <EnhancedSkeleton className="inline-block h-6 w-24 align-middle" />
            ) : (
              <span className="text-lg font-semibold text-primary">
                {formattedTotalValue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <HeaderRow>
              <TableHead>Coin</TableHead>
              <TableHead>Asset Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Standard</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">USD Price</TableHead>
              <TableHead className="text-right">USD Value</TableHead>
            </HeaderRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="p-3">
                      <EnhancedSkeleton className="h-5 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayedCoins.length > 0 ? (
              displayedCoins.map((coin) => (
                <CoinRow key={coin.assetType} coin={coin} />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  No coins match the current filters.
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
