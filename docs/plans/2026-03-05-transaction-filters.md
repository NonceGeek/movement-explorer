# Transaction Filters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add column-level filters (Direction, Function, Coin, Activity) and toolbar filters (Status, Date Range, Clear Filters) to the account transaction tables across all three sub-tabs.

**Architecture:** Each filter is a self-contained component rendered inside table headers or toolbar. Filters use client-side filtering on already-loaded data (Direction, Function, Status) or modify Indexer query parameters (Coin Type, Activity Type). The `TransactionTableHeader` gains a `filters` prop that maps column keys to filter components. The `TransactionTableToolbar` gains `activeFilterCount`, `onClearFilters`, and a `filterSlot` for toolbar-level filters.

**Tech Stack:** React 18, Next.js (app router), TypeScript, Tailwind CSS, shadcn/ui (DropdownMenu, ToggleGroup, Input), @tanstack/react-query, Aptos Indexer GraphQL via `sdk_v2_client.queryIndexer`

**Design Spec:** `/Users/fun/Documents/GitHub/movement-explore-docs/features/2026-03-03-transaction-filters-ui.md`

---

## Phase 1: Core Column Filters

### Task 1: Direction Column Filter Component

Create a reusable `DirectionColumnFilter` dropdown that lets users filter by transaction direction.

**Files:**
- Create: `src/components/transactions/filters/DirectionColumnFilter.tsx`

**Step 1: Create DirectionColumnFilter**

```tsx
"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";
import { TransactionDirection } from "@/utils/transaction";

export type DirectionFilterValue = "any" | TransactionDirection;

const DIRECTION_OPTIONS: { value: DirectionFilterValue; label: string }[] = [
  { value: "any", label: "ANY" },
  { value: "out", label: "OUT" },
  { value: "in", label: "IN" },
  { value: "self", label: "SELF" },
  { value: "call", label: "CALL" },
  { value: "related", label: "RELATED" },
];

interface DirectionColumnFilterProps {
  value: DirectionFilterValue;
  onChange: (value: DirectionFilterValue) => void;
}

export function DirectionColumnFilter({
  value,
  onChange,
}: DirectionColumnFilterProps) {
  const isActive = value !== "any";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
            isActive
              ? "text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {isActive ? `DIR: ${value.toUpperCase()}` : "DIR"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onChange(v as DirectionFilterValue)}
        >
          {DIRECTION_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Verify it builds**

Run: `cd /Users/fun/Documents/GitHub/movement-explorer && npx next build --no-lint 2>&1 | tail -5`
Expected: Compile succeeds (component not yet used, just no syntax errors)

**Step 3: Commit**

```bash
git add src/components/transactions/filters/DirectionColumnFilter.tsx
git commit -m "feat: add DirectionColumnFilter component"
```

---

### Task 2: Wire Direction Filter into TransactionTableHeader

Modify `TransactionTableHeader` to accept optional filter renderers keyed by column key. When a filter is provided for a column, render it instead of the plain label.

**Files:**
- Modify: `src/components/transactions/TransactionTableHeader.tsx`
- Modify: `src/components/transactions/types.ts`

**Step 1: Add `columnFilters` prop to types**

In `src/components/transactions/types.ts`, add to the `TransactionTableProps` interface:

```typescript
import { ReactNode } from "react";

// Add new type (after TransactionColumnConfig):
export type ColumnFilters = Partial<Record<TransactionColumnKey, ReactNode>>;
```

Add `columnFilters?: ColumnFilters` to `TransactionTableProps`.

**Step 2: Update TransactionTableHeader to use columnFilters**

In `TransactionTableHeader.tsx`, add `columnFilters` prop:

```typescript
interface TransactionTableHeaderProps {
  columns: TransactionColumnConfig[];
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode: (mode: "age" | "dateTime") => void;
  columnFilters?: ColumnFilters;
}
```

In the `default` case of `renderHeaderCell`, check if a filter exists for the column:

```typescript
default: {
  const filter = columnFilters?.[column.key];
  return (
    <StyledTableHead
      key={column.key}
      className={cn(hideClass, alignClass, widthClass)}
    >
      {filter ?? column.label}
    </StyledTableHead>
  );
}
```

**Step 3: Thread `columnFilters` through TransactionTable**

In `TransactionTable.tsx`, add `columnFilters` to props and pass to `TransactionTableHeader`:

```typescript
// In TransactionTableProps (types.ts), add:
columnFilters?: ColumnFilters;

// In TransactionTable.tsx:
<TransactionTableHeader
  columns={columns}
  timestampMode={timestampMode}
  onToggleTimestampMode={onToggleTimestampMode}
  columnFilters={columnFilters}
/>
```

**Step 4: Verify it builds**

Run: `cd /Users/fun/Documents/GitHub/movement-explorer && npx next build --no-lint 2>&1 | tail -5`
Expected: Compile succeeds, existing tables unaffected (columnFilters is optional)

**Step 5: Commit**

```bash
git add src/components/transactions/types.ts src/components/transactions/TransactionTableHeader.tsx src/components/transactions/TransactionTable.tsx
git commit -m "feat: support columnFilters prop in TransactionTableHeader"
```

---

### Task 3: Add Direction Filter to TransactionsSubTab

Wire the `DirectionColumnFilter` into the Transactions sub-tab with client-side filtering.

**Files:**
- Modify: `src/app/account/[address]/components/Tabs/TransactionsTab.tsx`

**Step 1: Add filter state and filtering logic to TransactionsSubTab**

```typescript
import { DirectionColumnFilter, DirectionFilterValue } from "@/components/transactions/filters/DirectionColumnFilter";
import { getTransactionDirection } from "@/utils/transaction";
import { ColumnFilters } from "@/components/transactions";

// Inside TransactionsSubTab, add state:
const [directionFilter, setDirectionFilter] = useState<DirectionFilterValue>("any");

// Filter tableData:
const filteredData = directionFilter === "any"
  ? tableData
  : tableData.filter((row) => {
      const dir = getTransactionDirection(row.transaction, address);
      return dir === directionFilter;
    });

// Build columnFilters:
const columnFilters: ColumnFilters = {
  direction: (
    <DirectionColumnFilter
      value={directionFilter}
      onChange={(v) => {
        setDirectionFilter(v);
      }}
    />
  ),
};
```

Pass `filteredData` instead of `tableData` to `TransactionTable`, and pass `columnFilters`.

**Step 2: Verify the filter works**

Run dev server, navigate to an account page, verify:
1. Direction column header shows "DIR" with chevron
2. Clicking opens dropdown with ANY/OUT/IN/SELF/CALL/RELATED
3. Selecting a direction filters the visible rows
4. Selecting "ANY" shows all rows again
5. Active filter shows highlighted "DIR: IN" style

**Step 3: Commit**

```bash
git add src/app/account/[address]/components/Tabs/TransactionsTab.tsx
git commit -m "feat: add Direction column filter to TransactionsSubTab"
```

---

### Task 4: Add Direction Filter to CoinTransfersTab

Same pattern as TransactionsSubTab but for the Token Transfers sub-tab.

**Files:**
- Modify: `src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx`

**Step 1: Add direction filter state and filtering**

Same pattern as Task 3 — import `DirectionColumnFilter`, add state, filter `tableData`, build `columnFilters`, pass to `TransactionTable`.

**Step 2: Verify and commit**

```bash
git add src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx
git commit -m "feat: add Direction column filter to CoinTransfersTab"
```

---

### Task 5: Coin Type Column Filter Component

Create a searchable dropdown for filtering Token Transfers by coin/asset type. This filter is **server-side** — it passes `assetType` to the hook.

**Files:**
- Create: `src/components/transactions/filters/CoinColumnFilter.tsx`

**Step 1: Create CoinColumnFilter**

Uses `Input` for search + `DropdownMenu` for the dropdown. The coin list is derived from a simple known-coins list plus whatever the user types.

```tsx
"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
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
    <DropdownMenu>
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
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
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
```

**Step 2: Commit**

```bash
git add src/components/transactions/filters/CoinColumnFilter.tsx
git commit -m "feat: add CoinColumnFilter component with search"
```

---

### Task 6: Wire Coin Filter into CoinTransfersTab (Server-Side)

Connect `CoinColumnFilter` to `CoinTransfersTab`. Since `useGetAccountCoinTransfers` already accepts `assetType`, just pass the filter value through.

**Files:**
- Modify: `src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx`

**Step 1: Add coin filter state**

```typescript
import { CoinColumnFilter } from "@/components/transactions/filters/CoinColumnFilter";

// Inside CoinTransfersTab:
const [coinFilter, setCoinFilter] = useState<string | null>(null);

// Pass to hooks:
const { data: totalCount } = useGetAccountCoinTransfersCount(address, coinFilter);
const { data: transactionVersions, isLoading: versionsLoading } =
  useGetAccountCoinTransfers(address, MAX_DISPLAY, 0, coinFilter);

// Add to columnFilters:
const columnFilters: ColumnFilters = {
  direction: ( /* existing */ ),
  token: (
    <CoinColumnFilter
      value={coinFilter}
      onChange={(v) => setCoinFilter(v)}
    />
  ),
};
```

**Step 2: Verify the filter works**

- Select "MOVE" → only MOVE-related coin transfer transactions shown
- Select "All Coins" → all token transfers shown
- Count updates correctly

**Step 3: Commit**

```bash
git add src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx
git commit -m "feat: add Coin type server-side filter to CoinTransfersTab"
```

---

### Task 7: Toolbar Filter Indicator and Clear Filters Button

Add a "(filtered)" indicator and "Clear Filters" button to the info text area when any filter is active.

**Files:**
- Modify: `src/app/account/[address]/components/Tabs/TransactionsTab.tsx`
- Modify: `src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx`

**Step 1: Add filter indicator to TransactionsSubTab**

In the info text area, add a "(filtered)" badge and "Clear Filters" link when `directionFilter !== "any"`:

```tsx
{directionFilter !== "any" && (
  <>
    <span className="text-primary/80 ml-1">(filtered)</span>
    <button
      onClick={() => setDirectionFilter("any")}
      className="text-xs text-primary hover:underline ml-2"
    >
      Clear Filters
    </button>
  </>
)}
```

**Step 2: Add filter indicator to CoinTransfersTab**

Same pattern, but check both `directionFilter !== "any"` and `coinFilter !== null`:

```tsx
const hasActiveFilters = directionFilter !== "any" || coinFilter !== null;

const clearAllFilters = () => {
  setDirectionFilter("any");
  setCoinFilter(null);
};

// In the info text:
{hasActiveFilters && (
  <>
    <span className="text-primary/80 ml-1">(filtered)</span>
    <button
      onClick={clearAllFilters}
      className="text-xs text-primary hover:underline ml-2"
    >
      Clear Filters
    </button>
  </>
)}
```

**Step 3: Commit**

```bash
git add src/app/account/[address]/components/Tabs/TransactionsTab.tsx src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx
git commit -m "feat: add filtered indicator and Clear Filters button"
```

---

### Task 8: Sub-Tab Switch Resets Filters

When switching between sub-tabs, reset all filters to defaults.

**Files:**
- Modify: `src/app/account/[address]/components/Tabs/TransactionsTab.tsx`

**Step 1: Reset on tab change**

In `TransactionsTab`, the `handleTabChange` already sets the sub-tab. Since each sub-tab is a separate component with its own `useState` hooks, switching tabs naturally remounts the component and resets state. Verify this is the case by:

1. Set a direction filter on Transactions tab
2. Switch to Token Transfers tab
3. Switch back to Transactions tab
4. Verify the filter is reset to "ANY"

If `TabsContent` uses `forceMount`, the state may persist. In that case, we need to lift state or add a `key` prop to force remount:

```tsx
<TabsContent value="txns" className="mt-2">
  <TransactionsSubTab key={`txns-${subTab}`} address={address} accountData={accountData} />
</TabsContent>
```

But test first — if React already unmounts on tab switch, no code change needed. Just verify and document.

**Step 2: Commit if changes were needed**

```bash
git add src/app/account/[address]/components/Tabs/TransactionsTab.tsx
git commit -m "fix: ensure sub-tab switch resets filter state"
```

---

## Phase 2: Additional Filters

### Task 9: Activity Column Filter for NFT Transfers (Server-Side)

Create an `ActivityColumnFilter` and wire it into `NFTTransfersTab`. This filter modifies the Indexer query.

**Files:**
- Create: `src/components/transactions/filters/ActivityColumnFilter.tsx`
- Modify: `src/hooks/accounts/useGetAccountNFTTransfers.ts`
- Modify: `src/hooks/accounts/useGetAccountNFTTransfersCount.ts`
- Modify: `src/app/account/[address]/components/Tabs/NFTTransfersTab.tsx`

**Step 1: Create ActivityColumnFilter**

```tsx
"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";

const ACTIVITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "0x4::collection::MintEvent", label: "Mint" },
  { value: "0x1::object::TransferEvent", label: "Transfer" },
  { value: "0x4::collection::BurnEvent", label: "Burn" },
];

interface ActivityColumnFilterProps {
  value: string | null;
  onChange: (activityType: string | null) => void;
}

export function ActivityColumnFilter({
  value,
  onChange,
}: ActivityColumnFilterProps) {
  const isActive = value !== null;
  const activeLabel = ACTIVITY_OPTIONS.find((o) => o.value === value)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
            isActive
              ? "text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {isActive ? `Activity: ${activeLabel}` : "Activity"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        <DropdownMenuRadioGroup
          value={value ?? "all"}
          onValueChange={(v) => onChange(v === "all" ? null : v)}
        >
          {ACTIVITY_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Add `activityType` param to NFT hooks**

In `useGetAccountNFTTransfers.ts`, add `activityType?: string | null` parameter. When provided, add `type: { _eq: $activityType }` to the where clause:

```typescript
export function useGetAccountNFTTransfers(
  address: string,
  limit: number = 25,
  offset: number = 0,
  activityType?: string | null,
): UseQueryResult<NFTActivity[], ResponseError> {
  // ...
  // Build query with conditional type filter
  const typeFilter = activityType ? `type: { _eq: $activityType }` : "";
  const variables = activityType
    ? { address, limit, offset, activityType }
    : { address, limit, offset };
  // Two query variants (same pattern as useGetAccountCoinTransfers)
}
```

Same for `useGetAccountNFTTransfersCount.ts`.

**Step 3: Wire into NFTTransfersTab**

Add state and pass to hooks + render filter in the Activity column header. Since NFTTransfersTab uses a custom table (not TransactionTable), add the filter directly in the `<StyledTableHead>` for the Activity column.

**Step 4: Commit**

```bash
git add src/components/transactions/filters/ActivityColumnFilter.tsx \
  src/hooks/accounts/useGetAccountNFTTransfers.ts \
  src/hooks/accounts/useGetAccountNFTTransfersCount.ts \
  src/app/account/[address]/components/Tabs/NFTTransfersTab.tsx
git commit -m "feat: add Activity type server-side filter to NFTTransfersTab"
```

---

### Task 10: Function Column Filter for TransactionsSubTab (Client-Side)

Create a `FunctionColumnFilter` that derives its options from the current page's transaction data.

**Files:**
- Create: `src/components/transactions/filters/FunctionColumnFilter.tsx`
- Modify: `src/app/account/[address]/components/Tabs/TransactionsTab.tsx`

**Step 1: Create FunctionColumnFilter**

```tsx
"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";
import { getTransactionFunction } from "@/utils/transaction";
import { TransactionRowData } from "../types";

interface FunctionColumnFilterProps {
  value: string | null;
  onChange: (functionName: string | null) => void;
  /** Current page data to derive function options from */
  transactions: TransactionRowData[];
}

export function FunctionColumnFilter({
  value,
  onChange,
  transactions,
}: FunctionColumnFilterProps) {
  const [search, setSearch] = useState("");
  const isActive = value !== null;

  // Derive unique function names from current page
  const functionOptions = useMemo(() => {
    const fns = new Set<string>();
    for (const { transaction } of transactions) {
      const fn = getTransactionFunction(transaction);
      if (fn) fns.add(fn);
    }
    return Array.from(fns).sort();
  }, [transactions]);

  const filteredOptions = useMemo(() => {
    if (!search) return functionOptions;
    const q = search.toLowerCase();
    return functionOptions.filter((fn) => fn.toLowerCase().includes(q));
  }, [search, functionOptions]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
            isActive
              ? "text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {isActive ? `Fn: ${value}` : "Function"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-background">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              placeholder="Search..."
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
          All Functions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="max-h-48 overflow-y-auto">
          {filteredOptions.map((fn) => (
            <DropdownMenuItem
              key={fn}
              onClick={() => { onChange(fn); setSearch(""); }}
              className={cn(
                "font-mono text-xs",
                value === fn && "font-medium",
              )}
            >
              {fn}
            </DropdownMenuItem>
          ))}
          {filteredOptions.length === 0 && (
            <div className="px-2 py-4 text-sm text-center text-muted-foreground">
              No functions found
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Wire into TransactionsSubTab**

```typescript
import { FunctionColumnFilter } from "@/components/transactions/filters/FunctionColumnFilter";

// Add state:
const [functionFilter, setFunctionFilter] = useState<string | null>(null);

// Filter (after direction filter):
const filteredData = tableData
  .filter((row) => {
    if (directionFilter !== "any") {
      return getTransactionDirection(row.transaction, address) === directionFilter;
    }
    return true;
  })
  .filter((row) => {
    if (functionFilter) {
      return getTransactionFunction(row.transaction) === functionFilter;
    }
    return true;
  });

// Add to columnFilters:
const columnFilters: ColumnFilters = {
  direction: ( /* existing */ ),
  function: (
    <FunctionColumnFilter
      value={functionFilter}
      onChange={setFunctionFilter}
      transactions={tableData}
    />
  ),
};

// Update hasActiveFilters and clearAllFilters accordingly
```

**Step 3: Commit**

```bash
git add src/components/transactions/filters/FunctionColumnFilter.tsx \
  src/app/account/[address]/components/Tabs/TransactionsTab.tsx
git commit -m "feat: add Function column filter to TransactionsSubTab"
```

---

### Task 11: Token Transfers Status Filter (Client-Side)

Add a Status toolbar filter (All / Success / Failed) to CoinTransfersTab. Since REST-fetched transactions have a `success` field, this is client-side filtering.

**Files:**
- Modify: `src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx`

**Step 1: Add status filter state and UI**

```typescript
// State:
const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");

// Filter logic (add to the filtering chain):
const filteredData = tableData
  .filter((row) => { /* direction filter */ })
  .filter((row) => {
    if (statusFilter === "all") return true;
    const success = "success" in row.transaction ? row.transaction.success : true;
    return statusFilter === "success" ? success : !success;
  });

// Toolbar UI using ToggleGroup:
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Render above the table:
<div className="flex items-center gap-3">
  <span className="text-xs text-muted-foreground">Status:</span>
  <ToggleGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)} size="sm">
    <ToggleGroupItem value="all">All</ToggleGroupItem>
    <ToggleGroupItem value="success">Success</ToggleGroupItem>
    <ToggleGroupItem value="failed">Failed</ToggleGroupItem>
  </ToggleGroup>
</div>
```

**Step 2: Update hasActiveFilters**

```typescript
const hasActiveFilters = directionFilter !== "any" || coinFilter !== null || statusFilter !== "all";

const clearAllFilters = () => {
  setDirectionFilter("any");
  setCoinFilter(null);
  setStatusFilter("all");
};
```

**Step 3: Commit**

```bash
git add src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx
git commit -m "feat: add Status toolbar filter to CoinTransfersTab"
```

---

### Task 12: Date Range Filter Component

Create a date range filter component for the toolbar. Uses quick-select buttons (24h, 7d, 30d) plus custom date inputs.

**Files:**
- Create: `src/components/transactions/filters/DateRangeFilter.tsx`

**Step 1: Create DateRangeFilter**

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/utils/styling";

export interface DateRange {
  from: string | null; // ISO date string
  to: string | null;
}

const QUICK_OPTIONS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const isActive = value.from !== null || value.to !== null;

  const handleQuick = (hours: number) => {
    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    onChange({ from: from.toISOString(), to: now.toISOString() });
    setShowCustom(false);
  };

  const handleClear = () => {
    onChange({ from: null, to: null });
    setShowCustom(false);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Date:</span>
      <div className="inline-flex items-center rounded-lg p-0.5 border border-border bg-muted/30">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleQuick(opt.hours)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              // Simple active check — if from/to matches this range approximately
              "text-muted-foreground hover:text-foreground cursor-pointer",
            )}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
            showCustom
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Custom
        </button>
      </div>
      {isActive && (
        <button
          onClick={handleClear}
          className="text-xs text-primary hover:underline"
        >
          Clear
        </button>
      )}
      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={value.from?.split("T")[0] ?? ""}
            onChange={(e) =>
              onChange({ ...value, from: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
            className="h-7 px-2 text-xs border border-border rounded-md bg-background"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={value.to?.split("T")[0] ?? ""}
            onChange={(e) =>
              onChange({ ...value, to: e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : null })
            }
            className="h-7 px-2 text-xs border border-border rounded-md bg-background"
          />
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/transactions/filters/DateRangeFilter.tsx
git commit -m "feat: add DateRangeFilter toolbar component"
```

---

### Task 13: Wire Date Range into Transactions Hooks (Server-Side)

Add timestamp filtering support to `useGetAccountTransactionVersions` and wire into TransactionsSubTab.

**Files:**
- Modify: `src/hooks/accounts/useGetAccountTransactionVersions.ts`
- Modify: `src/app/account/[address]/components/Tabs/TransactionsTab.tsx`

**Step 1: Add timestamp params to hook**

Add `timestampGte?: string | null` and `timestampLte?: string | null` parameters. When provided, add `user_transaction: { timestamp: { _gte: $timestampGte, _lte: $timestampLte } }` to the where clause.

This requires building a dynamic query similar to the `useGetAccountCoinTransfers` pattern (two query variants — one with timestamp filter, one without).

**Step 2: Wire DateRangeFilter into TransactionsSubTab**

```typescript
import { DateRangeFilter, DateRange } from "@/components/transactions/filters/DateRangeFilter";

const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

// Pass to hook:
const { data: transactionVersions } = useGetAccountTransactionVersions(
  address, MAX_DISPLAY, 0, dateRange.from, dateRange.to,
);

// Render DateRangeFilter above the table in the info area
```

**Step 3: Update clearAllFilters**

```typescript
const hasActiveFilters = directionFilter !== "any" || functionFilter !== null || dateRange.from !== null;

const clearAllFilters = () => {
  setDirectionFilter("any");
  setFunctionFilter(null);
  setDateRange({ from: null, to: null });
};
```

**Step 4: Commit**

```bash
git add src/hooks/accounts/useGetAccountTransactionVersions.ts \
  src/app/account/[address]/components/Tabs/TransactionsTab.tsx
git commit -m "feat: add Date Range server-side filter to TransactionsSubTab"
```

---

### Task 14: Wire Date Range into CoinTransfersTab

Same pattern — add timestamp filtering to `useGetAccountCoinTransfers`.

**Files:**
- Modify: `src/hooks/accounts/useGetAccountCoinTransfers.ts`
- Modify: `src/hooks/accounts/useGetAccountCoinTransfersCount.ts`
- Modify: `src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx`

**Step 1: Add timestamp params**

Similar to Task 13: add `timestampGte/Lte` to the hook, using `user_transaction: { timestamp: { _gte, _lte } }` in the where clause.

**Step 2: Wire DateRangeFilter into CoinTransfersTab**

**Step 3: Commit**

```bash
git add src/hooks/accounts/useGetAccountCoinTransfers.ts \
  src/hooks/accounts/useGetAccountCoinTransfersCount.ts \
  src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx
git commit -m "feat: add Date Range server-side filter to CoinTransfersTab"
```

---

## Phase 3: Advanced Features

### Task 15: Transactions Sub-Tab Status Filter

The `user_transactions` table has no `success` field, so this uses client-side filtering on already-fetched REST data. Add the same ToggleGroup pattern from Task 11 to TransactionsSubTab.

**Files:**
- Modify: `src/app/account/[address]/components/Tabs/TransactionsTab.tsx`

**Step 1: Add status filter**

Same pattern as Task 11 — add `statusFilter` state, filter `tableData`, add `ToggleGroup` UI.

**Step 2: Commit**

```bash
git add src/app/account/[address]/components/Tabs/TransactionsTab.tsx
git commit -m "feat: add Status client-side filter to TransactionsSubTab"
```

---

### Task 16: Advanced Filter Page Entry

Add a link/button in the toolbar that navigates to a dedicated filter page (future). For now, just add the entry point that links to `/transactions?address=...` with current filter params.

**Files:**
- Modify: `src/components/transactions/TransactionTableToolbar.tsx`
- Modify: `src/app/account/[address]/components/Tabs/TransactionsTab.tsx`

**Step 1: Add "Advanced Filter" button**

In TransactionsSubTab, add a small button next to the info text that links to the full transactions page:

```tsx
<Button variant="ghost" size="sm" asChild className="text-xs">
  <Link href={`/transactions?address=${address}`}>
    <SlidersHorizontal className="h-3 w-3 mr-1" />
    Advanced
  </Link>
</Button>
```

**Step 2: Commit**

```bash
git add src/app/account/[address]/components/Tabs/TransactionsTab.tsx
git commit -m "feat: add Advanced Filter entry point"
```

---

### Task 17: Amount Range Filter (Client-Side)

Add a simple min/max amount filter to transactions and token transfers.

**Files:**
- Create: `src/components/transactions/filters/AmountRangeFilter.tsx`
- Modify: `src/app/account/[address]/components/Tabs/TransactionsTab.tsx`
- Modify: `src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx`

**Step 1: Create AmountRangeFilter**

```tsx
"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";

export interface AmountRange {
  min: string;
  max: string;
}

interface AmountRangeFilterProps {
  value: AmountRange;
  onChange: (range: AmountRange) => void;
}

export function AmountRangeFilter({ value, onChange }: AmountRangeFilterProps) {
  const isActive = value.min !== "" || value.max !== "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
            isActive
              ? "text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {isActive ? "Amount (filtered)" : "Amount"}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-3">
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground">Min (MOVE)</label>
            <input
              type="number"
              step="any"
              placeholder="0"
              value={value.min}
              onChange={(e) => onChange({ ...value, min: e.target.value })}
              className="w-full h-7 px-2 text-xs border border-border rounded-md bg-background mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Max (MOVE)</label>
            <input
              type="number"
              step="any"
              placeholder="No limit"
              value={value.max}
              onChange={(e) => onChange({ ...value, max: e.target.value })}
              className="w-full h-7 px-2 text-xs border border-border rounded-md bg-background mt-1"
            />
          </div>
          {isActive && (
            <button
              onClick={() => onChange({ min: "", max: "" })}
              className="w-full text-xs text-primary hover:underline pt-1"
            >
              Clear
            </button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Wire into TransactionsSubTab and CoinTransfersTab**

Client-side filter: compare `getTransactionAmount(tx)` against min/max (converting MOVE to octas for comparison).

**Step 3: Commit**

```bash
git add src/components/transactions/filters/AmountRangeFilter.tsx \
  src/app/account/[address]/components/Tabs/TransactionsTab.tsx \
  src/app/account/[address]/components/Tabs/CoinTransfersTab.tsx
git commit -m "feat: add Amount range client-side filter"
```

---

### Task 18: Export CSV

Add a "Download CSV" button to the toolbar that exports the current filtered view.

**Files:**
- Modify: `src/components/transactions/DownloadPageData.tsx`

**Step 1: Enhance DownloadPageData to support CSV export**

The existing `DownloadPageData` component already exists. Enhance it to export CSV format with columns matching the current table view. Include: Hash, Function, Timestamp, Sender, Direction, To, Amount, Gas/Token.

Use the browser's Blob API to generate and download a CSV file.

**Step 2: Commit**

```bash
git add src/components/transactions/DownloadPageData.tsx
git commit -m "feat: enhance CSV export for filtered transactions"
```

---

## Export filters from index

### Task 19: Update barrel export

**Files:**
- Modify: `src/components/transactions/index.ts`

**Step 1: Add filter exports**

```typescript
// Filters
export { DirectionColumnFilter } from "./filters/DirectionColumnFilter";
export { CoinColumnFilter } from "./filters/CoinColumnFilter";
export { FunctionColumnFilter } from "./filters/FunctionColumnFilter";
export { ActivityColumnFilter } from "./filters/ActivityColumnFilter";
export { DateRangeFilter } from "./filters/DateRangeFilter";
export { AmountRangeFilter } from "./filters/AmountRangeFilter";
export type { ColumnFilters } from "./types";
```

**Step 2: Commit**

```bash
git add src/components/transactions/index.ts
git commit -m "chore: export filter components from barrel"
```

---

## Summary

| Phase | Task | Description | Filter Type |
|-------|------|-------------|-------------|
| 1 | 1-2 | Direction filter component + header integration | Infrastructure |
| 1 | 3 | Direction filter → TransactionsSubTab | Client-side |
| 1 | 4 | Direction filter → CoinTransfersTab | Client-side |
| 1 | 5-6 | Coin type filter → CoinTransfersTab | Server-side |
| 1 | 7 | Toolbar: (filtered) + Clear Filters | UI |
| 1 | 8 | Sub-tab switch resets filters | UX |
| 2 | 9 | Activity filter → NFTTransfersTab | Server-side |
| 2 | 10 | Function filter → TransactionsSubTab | Client-side |
| 2 | 11 | Status filter → CoinTransfersTab | Client-side |
| 2 | 12-14 | Date Range filter → all tabs | Server-side |
| 3 | 15 | Status filter → TransactionsSubTab | Client-side |
| 3 | 16 | Advanced Filter page entry | UI |
| 3 | 17 | Amount range filter | Client-side |
| 3 | 18 | Export CSV | Feature |
| - | 19 | Barrel export cleanup | Chore |
