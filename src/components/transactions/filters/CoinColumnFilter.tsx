"use client";

import { useState, useMemo } from "react";
import { Funnel, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";

// Well-known coins on Movement
const KNOWN_COINS = [
  { symbol: "MOVE", assetType: "0x1::aptos_coin::AptosCoin" },
  { symbol: "USDC", assetType: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC" },
  { symbol: "USDT", assetType: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT" },
  { symbol: "WETH", assetType: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH" },
  { symbol: "WBTC", assetType: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC" },
];

interface CoinColumnFilterProps {
  value: string | null;
  onChange: (assetType: string | null) => void;
}

export function CoinColumnFilter({ value, onChange }: CoinColumnFilterProps) {
  const [search, setSearch] = useState("");
  const isActive = value !== null;

  const activeLabel = useMemo(() => {
    if (!value) return null;
    const known = KNOWN_COINS.find((c) => c.assetType === value);
    return known?.symbol ?? value.split("::").pop() ?? "Token";
  }, [value]);

  const filteredCoins = useMemo(() => {
    if (!search) return KNOWN_COINS;
    const q = search.toLowerCase();
    return KNOWN_COINS.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.assetType.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
            isActive
              ? "text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {isActive ? `Token: ${activeLabel}` : "Token"}
          <span className="relative">
            <Funnel className="h-3.5 w-3.5" />
            {isActive && (
              <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 rounded-2xl">
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-background">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch("")} className="shrink-0">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { onChange(null); setSearch(""); }}
          className={cn(!isActive && "font-medium")}
        >
          All Coins
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {filteredCoins.map((coin) => (
          <DropdownMenuItem
            key={coin.assetType}
            onClick={() => { onChange(coin.assetType); setSearch(""); }}
            className={cn(value === coin.assetType && "font-medium")}
          >
            {coin.symbol}
          </DropdownMenuItem>
        ))}
        {filteredCoins.length === 0 && (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            No tokens found
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
