"use client";

import { useEffect, useState, useMemo } from "react";
import { Funnel, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import { CoinDescription } from "@/hooks/coins/types";
import { getAssetSymbol } from "@/utils/transaction";
import { AssetCell } from "@/components/common/AssetCell";

interface CoinColumnFilterProps {
  value: string | null;
  onChange: (assetType: string | null) => void;
  tokens?: TokenOption[];
  isLoading?: boolean;
}

export type TokenOption = {
  label: string;
  name: string;
  value: string;
  tokenAddress: string | null;
  logoUrl?: string | null;
  subtext?: string;
};

function getFilterAssetType(coin: CoinDescription) {
  return coin.faAddress || coin.tokenAddress;
}

function getTokenLabel(coin: CoinDescription) {
  return (
    getAssetSymbol(
      coin.panoraSymbol ?? undefined,
      coin.bridge ?? undefined,
      coin.symbol,
    ) || coin.symbol
  );
}

export function CoinColumnFilter({
  value,
  onChange,
  tokens,
  isLoading: tokensLoading,
}: CoinColumnFilterProps) {
  const [search, setSearch] = useState("");
  const { data: coinListData, isLoading } = useGetCoinList();
  const isActive = value !== null;

  const tokenOptions = useMemo(() => {
    if (tokens) return tokens;

    const seen = new Set<string>();
    const coins = coinListData?.data ?? [];

    return coins
      .map((coin): TokenOption | null => {
        const assetType = getFilterAssetType(coin);
        if (!assetType || seen.has(assetType)) return null;
        seen.add(assetType);

        return {
          label: getTokenLabel(coin),
          name: coin.name,
          value: assetType,
          tokenAddress: coin.tokenAddress,
          logoUrl: coin.logoUrl,
        };
      })
      .filter((option): option is TokenOption => option !== null)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [coinListData?.data, tokens]);

  const loading = tokensLoading ?? isLoading;

  const activeLabel = useMemo(() => {
    if (!value) return null;
    const known = tokenOptions.find(
      (token) => token.value === value || token.tokenAddress === value,
    );
    if (known?.subtext) return `${known.label} (${known.subtext})`;
    return known?.label ?? value.split("::").pop() ?? "Token";
  }, [tokenOptions, value]);

  useEffect(() => {
    if (!tokens || loading || !value) return;

    const hasSelectedToken = tokenOptions.some(
      (token) => token.value === value || token.tokenAddress === value,
    );

    if (!hasSelectedToken) {
      onChange(null);
    }
  }, [loading, onChange, tokenOptions, tokens, value]);

  const filteredTokens = useMemo(() => {
    if (!search) return tokenOptions;
    const q = search.toLowerCase();
    return tokenOptions.filter(
      (token) =>
        token.label.toLowerCase().includes(q) ||
        token.name.toLowerCase().includes(q) ||
        token.value.toLowerCase().includes(q) ||
        token.tokenAddress?.toLowerCase().includes(q),
    );
  }, [search, tokenOptions]);

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
          {isActive && (
            <span
              role="button"
              aria-label="Clear token filter"
              tabIndex={0}
              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-primary/15"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(null);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                event.stopPropagation();
                onChange(null);
              }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
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
          onClick={() => {
            onChange(null);
            setSearch("");
          }}
          className={cn(!isActive && "font-medium")}
        >
          All Tokens
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {filteredTokens.map((token) => (
          <DropdownMenuItem
            key={token.value}
            onClick={() => {
              onChange(token.value);
              setSearch("");
            }}
            className={cn(value === token.value && "font-medium")}
          >
            <AssetCell
              assetId={token.value}
              symbol={token.label}
              logoUrl={token.logoUrl}
              showSubtext={!!token.subtext}
              subtext={token.subtext}
              maxWidth="150px"
              iconClassName="h-4 w-4"
            />
          </DropdownMenuItem>
        ))}
        {loading && filteredTokens.length === 0 && (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            Loading tokens...
          </div>
        )}
        {!loading && filteredTokens.length === 0 && (
          <div className="px-2 py-4 text-sm text-center text-muted-foreground">
            No tokens found
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
