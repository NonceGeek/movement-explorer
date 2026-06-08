"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Coins, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { AssetCell } from "@/components/common/AssetCell";
import { cn } from "@/utils/styling";
import { useCoinData } from "./Tabs/coins/useCoinData";

interface AccountTokenHoldingsDropdownProps {
  address: string;
  onViewAll: () => void;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AccountTokenHoldingsDropdown({
  address,
  onViewAll,
}: AccountTokenHoldingsDropdownProps) {
  const { coins, totalUsdValue, isLoading } = useCoinData(address);
  const [search, setSearch] = useState("");

  const visibleCoins = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coins.slice(0, 50);

    return coins
      .filter(
        (coin) =>
          coin.name.toLowerCase().includes(q) ||
          coin.symbol.toLowerCase().includes(q) ||
          coin.assetType.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [coins, search]);

  if (isLoading) {
    return <EnhancedSkeleton className="h-9 w-full mt-1" />;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "mt-1 flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/50 px-3 py-2",
            "text-left transition-colors hover:bg-muted",
          )}
        >
          <span className="min-w-0">
            <span className="font-semibold tabular-nums">
              {formatCurrency(totalUsdValue)}
            </span>
            <span className="ml-1.5 text-muted-foreground">
              ({coins.length.toLocaleString()} Tokens)
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(520px,calc(100vw-2rem))] rounded-xl border border-border bg-card p-0 shadow-xl"
      >
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for Token Name"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
                aria-label="Clear token search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="border-y border-border bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">
              Token Holdings ({coins.length.toLocaleString()})
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {formatCurrency(totalUsdValue)}
            </span>
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {visibleCoins.length > 0 ? (
            visibleCoins.map((coin) => (
              <button
                key={coin.assetType}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted/60"
                onClick={onViewAll}
              >
                <div className="min-w-0">
                  <AssetCell
                    assetId={coin.assetType}
                    symbol={coin.symbol}
                    logoUrl={coin.logoUrl}
                    showSubtext
                    subtext={coin.name}
                    maxWidth="220px"
                  />
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-sm tabular-nums">
                    {coin.usdValue !== null
                      ? formatCurrency(coin.usdValue)
                      : "-"}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground tabular-nums">
                    {coin.amount.toLocaleString("en-US", {
                      maximumFractionDigits: coin.decimals,
                    })}{" "}
                    {coin.symbol}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              No tokens found
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            size="sm"
            onClick={onViewAll}
          >
            <Coins className="h-4 w-4" />
            View All Holdings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
