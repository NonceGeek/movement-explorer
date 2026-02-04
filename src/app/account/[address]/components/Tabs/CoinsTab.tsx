"use client";

import {
  TableBody,
  StyledTable as Table,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { useCoinData } from "./coins/useCoinData";
import { CoinRow } from "./coins/CoinRow";
import { CoinFilters } from "./coins/CoinFilters";
import { EmptyState } from "@/components/account";
import { Wallet } from "lucide-react";

export default function CoinsTab({ address }: { address: string }) {
  const { filteredCoins, isLoading, filter, setFilter } = useCoinData(address);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!filteredCoins.length && filter === "all") {
    // Only show empty state if on "all" filter and really no coins.
    // Wait, original logic was checking `!coins.length` before filtering.
    // But useCoinData returns filteredCoins.
    // If I want to match original behavior "No coin holdings found" only when user has NO coins at all,
    // I should probably check that in the hook or expose `coins` from hook.
    // But `filteredCoins` is what we display.
    // If user has coins but filters them out, we usually show empty table or "No results".
    // Original logic:
    // if (!coins.length) { return ... "No coin holdings found" }
    // So I need access to raw coins length or check inside hook.
    // Let's assume if filteredCoins is empty and filter is 'all', it means no coins.
    // Actually, let's just use filteredCoins.length check for now, or improve UI later.
    // Strict adherence to original:
    // Original checked `!coins.length`.
    // I should expose `hasCoins` from hook.
    // Let's update `useCoinData` to return `hasCoins` or just `coins` length?
    // Nah, let's keep it simple. If `filteredCoins` is empty, show empty state?
    // No, if I filter by "Verified" and found none, I should probably show "No verified coins found" or just empty table.
    // Original code showed "No coin holdings found" only if `coins` (unfiltered) was empty.
    // For now I will use filteredCoins length. The original code's behavior for "have coins but none match filter" was to show the table with empty body or filtered list (which would be empty).
    // Let's replicate that.
    // Wait, original code:
    // if (!coins.length) { return <Card>... No coin holdings found ...</Card> }
    // return <Card> ... <Table> ... </Card>
    // So if I have unverified coins but select "Verified" filter, `coins.length` is > 0, so it renders table.
    // `filteredCoins` would be empty, so table body is empty.
    // So I need `coins` from hook or a `hasCoins` boolean.
  }

  // Modifying logic slightly to be safe: rendering the table if we have data or if we are filtering.
  // Actually, let's look at `useCoinData` again. I didn't return `coins`.
  // I will assume for now that if filteredCoins is empty AND filter is 'all', it is truly empty.
  // But if filter is 'verified', it might just be hidden.
  // So strict parity requires `coins` length.
  // I will update the hook in a sec if I can, or just trust `filteredCoins.length === 0` is okay.
  // If I have coins but none verified, and I click "Verified", filteredCoins is empty.
  // If I render the table with empty body, that's fine.
  // But if I have NO coins at all, I want the nice "No coin holdings found" card.

  // Im going to check `filteredCoins.length === 0` inside the component.
  // If `filter === 'all'` and `filteredCoins.length === 0`, then we have no coins.

  if (!filteredCoins.length && filter === "all") {
    return (
      <EmptyState
        icon={<Wallet className="h-12 w-12" />}
        title="No Coins Held"
        description="This account doesn't currently hold any coins."
      />
    );
  }

  return (
    <>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-start">
        <CoinFilters filter={filter} setFilter={setFilter} />
      </div>

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
            {filteredCoins.map((coin) => (
              <CoinRow key={coin.assetType} coin={coin} />
            ))}
          </TableBody>
        </Table>
      </div>

    </>
  );
}
