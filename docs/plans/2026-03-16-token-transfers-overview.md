# Fungible Asset Transfers Row in Transaction Overview

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Fungible Asset Transfers" row inside TransactionDetailsTable (after "Interacted With") that shows sender-centric in/out token movements inline in the Overview tab.

**Architecture:** Lift `useGetTransactionBalanceChanges` from `BalanceChangeTab` to `page.tsx` so the data is shared between the new overview row and the existing Balance Changes tab. A new `FungibleAssetTransfersRow` component handles filtering and display. `BalanceChangeTab` is refactored to accept data as props.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Apollo GraphQL client, Tailwind CSS, lucide-react icons.

---

### Task 1: Lift `useGetTransactionBalanceChanges` to page level

**Files:**
- Modify: `src/app/txn/[hash]/[[...tab]]/page.tsx`

**Context:**
Currently `BalanceChangeTab` calls `useGetTransactionBalanceChanges` internally. We need it at page level so the Overview tab can also use it.

In `page.tsx`, the transaction version is `txData.txVersion` (a string like "90429334"). The hook signature is:
```ts
useGetTransactionBalanceChanges(txn_version: string | number)
```
It returns `{ isLoading, error, data }` where `data` has shape `{ fungible_asset_activities: FungibleAssetActivity[] }`.

**Step 1: Import the hook and type in page.tsx**

At the top of `page.tsx`, add to the existing import from `@/hooks/transactions/useGetTransactionBalanceChanges`:
```ts
import {
  useGetTransactionBalanceChanges,
  type FungibleAssetActivity,
} from "@/hooks/transactions/useGetTransactionBalanceChanges";
```

**Step 2: Call the hook in the component body**

After the existing `useGetBlockByVersion` call (around line 82), add:
```ts
const { data: activitiesData, isLoading: activitiesLoading } =
  useGetTransactionBalanceChanges(
    txData.txVersion ? parseInt(txData.txVersion) : 0,
  );
const fungibleAssetActivities =
  activitiesData?.fungible_asset_activities ?? [];
```

**Step 3: Verify the app still compiles**

```bash
cd /Users/fun/Documents/GitHub/movement-explorer
bun run build 2>&1 | tail -20
```
Expected: No new errors (BalanceChangeTab will have a duplicate fetch for now — fixed in Task 2).

**Step 4: Commit**
```bash
git add src/app/txn/[hash]/[[...tab]]/page.tsx
git commit -m "refactor: lift useGetTransactionBalanceChanges to page level"
```

---

### Task 2: Refactor `BalanceChangeTab` to accept data as props

**Files:**
- Modify: `src/app/txn/[hash]/components/BalanceChangeTab.tsx`
- Modify: `src/app/txn/[hash]/[[...tab]]/page.tsx`

**Context:**
`BalanceChangeTab` currently calls `useGetTransactionBalanceChanges` and uses `transaction.version` to get the version. We change it to accept `activities` and `isLoading` as props. This removes the duplicate API call.

**Step 1: Update the BalanceChangeTab interface**

In `BalanceChangeTab.tsx`, replace the current `BalanceChangeTabProps` interface:
```ts
// BEFORE:
interface BalanceChangeTabProps {
  transaction: Types.Transaction;
}

// AFTER:
interface BalanceChangeTabProps {
  activities: FungibleAssetActivity[];
  isLoading: boolean;
}
```

Also add the import at the top:
```ts
import { type FungibleAssetActivity } from "@/hooks/transactions/useGetTransactionBalanceChanges";
```

**Step 2: Remove the internal hook call and transaction prop usage**

In `BalanceChangeTab.tsx`, remove these lines from the component body:
```ts
const version = "version" in transaction ? transaction.version : undefined;
const { data: transactionChangesResponse, isLoading } =
  useGetTransactionBalanceChanges(version ?? "");
```

And replace the `transactionChangesResponse?.fungible_asset_activities` reference in `balanceChanges` useMemo with the prop `activities` directly:
```ts
// BEFORE:
if (!transactionChangesResponse?.fungible_asset_activities) return [];
const activities = transactionChangesResponse.fungible_asset_activities;

// AFTER:
if (!activities || activities.length === 0) return [];
```

Update the component signature:
```ts
// BEFORE:
export function BalanceChangeTab({ transaction }: BalanceChangeTabProps) {

// AFTER:
export function BalanceChangeTab({ activities, isLoading }: BalanceChangeTabProps) {
```

**Step 3: Update the useMemo dependency array**

The `balanceChanges` useMemo currently depends on `[transactionChangesResponse]`. Change it to `[activities, coinData]` (coinData was already there).

**Step 4: Update the call site in page.tsx**

In the Balance Changes TabsContent (around line 389), change:
```tsx
// BEFORE:
{tx ? <BalanceChangeTab transaction={tx} /> : null}

// AFTER:
<BalanceChangeTab
  activities={fungibleAssetActivities}
  isLoading={activitiesLoading}
/>
```

**Step 5: Build to verify no errors**
```bash
bun run build 2>&1 | tail -20
```
Expected: Clean build. If TypeScript complains about unused `coinData` import, remove it.

**Step 6: Commit**
```bash
git add src/app/txn/[hash]/components/BalanceChangeTab.tsx src/app/txn/[hash]/[[...tab]]/page.tsx
git commit -m "refactor: BalanceChangeTab accepts activities as props instead of fetching"
```

---

### Task 3: Create `FungibleAssetTransfersRow` component

**Files:**
- Create: `src/app/txn/[hash]/components/FungibleAssetTransfersRow.tsx`

**Context:**
This component is a `DetailRow`-compatible row that shows sender-centric token transfers. The logic:
- Filter out `GasFeeEvent` entries (`type` contains "GasFee")
- Filter to activities where `owner_address` matches sender (case-insensitive)
- `Deposit` type → inbound (↓, green)
- `Withdraw` type → outbound (↑, red/muted)
- Format amount: `BigInt(amount) / 10^decimals`, show up to 8 significant decimals
- Show token symbol from `metadata.symbol`
- If no relevant activities remain after filtering → return null (don't render)
- Count in label: "Fungible Asset Transfers (N)"
- Bottom link: "View full breakdown →" calls `onTabChange("balance")`

**Step 1: Create the file**

```tsx
"use client";

import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { type FungibleAssetActivity } from "@/hooks/transactions/useGetTransactionBalanceChanges";
import { DetailRow } from "./DetailRow";
import { cn } from "@/utils/styling";

interface FungibleAssetTransfersRowProps {
  activities: FungibleAssetActivity[];
  senderAddress: string;
  onTabChange: (tab: string) => void;
}

function formatAmount(amount: number, decimals: number): string {
  const divisor = Math.pow(10, decimals);
  const value = amount / divisor;
  // Show up to 8 significant decimal places, strip trailing zeros
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  });
}

export function FungibleAssetTransfersRow({
  activities,
  senderAddress,
  onTabChange,
}: FungibleAssetTransfersRowProps) {
  // Filter: exclude gas fee events, only sender's activities
  const transfers = activities.filter((a) => {
    if (a.type.includes("GasFee")) return false;
    if (a.owner_address?.toLowerCase() !== senderAddress?.toLowerCase())
      return false;
    return true;
  });

  if (transfers.length === 0) return null;

  return (
    <DetailRow
      label={`Fungible Asset Transfers (${transfers.length})`}
      tooltip="Token movements for the transaction sender"
    >
      <div className="space-y-1.5">
        {transfers.map((activity, i) => {
          const isDeposit = activity.type.includes("Deposit");
          const decimals = activity.metadata?.decimals ?? 8;
          const symbol = activity.metadata?.symbol ?? "FA";
          const formattedAmount = formatAmount(activity.amount, decimals);

          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              {isDeposit ? (
                <ArrowDown className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5 text-red-400 shrink-0" />
              )}
              <span
                className={cn(
                  "font-mono",
                  isDeposit ? "text-green-500" : "text-red-400",
                )}
              >
                {isDeposit ? "+" : "-"}
                {formattedAmount}
              </span>
              <span className="text-muted-foreground">{symbol}</span>
            </div>
          );
        })}

        <button
          onClick={() => onTabChange("balance")}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 pt-1"
        >
          View full breakdown
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </DetailRow>
  );
}
```

**Step 2: Build to verify no errors**
```bash
bun run build 2>&1 | tail -20
```
Expected: Clean build.

**Step 3: Commit**
```bash
git add src/app/txn/[hash]/components/FungibleAssetTransfersRow.tsx
git commit -m "feat: add FungibleAssetTransfersRow component"
```

---

### Task 4: Wire `FungibleAssetTransfersRow` into `TransactionDetailsTable`

**Files:**
- Modify: `src/app/txn/[hash]/components/TransactionDetailsTable.tsx`
- Modify: `src/app/txn/[hash]/components/index.ts`

**Context:**
Add two new optional props to `TransactionDetailsTable`:
- `fungibleAssetActivities?: FungibleAssetActivity[]`
- `onTabChange?: (tab: string) => void`

Insert `<FungibleAssetTransfersRow>` right after the `counterparty` DetailRow block (line 163), before the `functionName` block.

**Step 1: Add imports to TransactionDetailsTable.tsx**

```ts
import { FungibleAssetTransfersRow } from "./FungibleAssetTransfersRow";
import { type FungibleAssetActivity } from "@/hooks/transactions/useGetTransactionBalanceChanges";
```

**Step 2: Add new props to the interface**

```ts
// Add to TransactionDetailsTableProps:
fungibleAssetActivities?: FungibleAssetActivity[];
onTabChange?: (tab: string) => void;
```

**Step 3: Destructure the new props**

```ts
// Add to the destructured parameters:
fungibleAssetActivities,
onTabChange,
```

**Step 4: Insert the new row after the counterparty block**

After the closing `)}` of the counterparty block (line 163), before `{functionName && (`, add:

```tsx
{fungibleAssetActivities && onTabChange && sender && (
  <FungibleAssetTransfersRow
    activities={fungibleAssetActivities}
    senderAddress={sender}
    onTabChange={onTabChange}
  />
)}
```

**Step 5: Export from index.ts**

Open `src/app/txn/[hash]/components/index.ts` and add:
```ts
export { FungibleAssetTransfersRow } from "./FungibleAssetTransfersRow";
```

**Step 6: Build to verify**
```bash
bun run build 2>&1 | tail -20
```
Expected: Clean build.

**Step 7: Commit**
```bash
git add src/app/txn/[hash]/components/TransactionDetailsTable.tsx src/app/txn/[hash]/components/index.ts
git commit -m "feat: add FungibleAssetTransfersRow to TransactionDetailsTable"
```

---

### Task 5: Pass data from page.tsx into TransactionDetailsTable

**Files:**
- Modify: `src/app/txn/[hash]/[[...tab]]/page.tsx`

**Context:**
Pass `fungibleAssetActivities`, `handleTabChange`, and `sender` into `TransactionDetailsTable`. The `handleTabChange` function already exists in page.tsx and handles URL + scroll position correctly.

**Step 1: Update the TransactionDetailsTable call in page.tsx**

In the Overview TabsContent, find the `<TransactionDetailsTable ... />` call and add two props:

```tsx
<TransactionDetailsTable
  // ... existing props unchanged ...
  fungibleAssetActivities={fungibleAssetActivities}
  onTabChange={handleTabChange}
/>
```

**Step 2: Verify visually by running dev server**
```bash
bun run dev
```
Navigate to a swap transaction (e.g. one from the screenshots). Verify:
- [ ] "Fungible Asset Transfers" row appears after "Interacted With"
- [ ] Shows ↓ +amount MOVE (green) and ↑ -amount USDT.e (red)
- [ ] "View full breakdown" link switches to Balance Changes tab
- [ ] On a non-token transaction (e.g. governance vote), the row does not appear
- [ ] Balance Changes tab still works correctly

**Step 3: Final build check**
```bash
bun run build 2>&1 | tail -20
```
Expected: Clean build with no errors.

**Step 4: Commit**
```bash
git add src/app/txn/[hash]/[[...tab]]/page.tsx
git commit -m "feat: wire FungibleAssetTransfersRow into transaction overview"
```

---

## Completion Checklist

- [ ] `useGetTransactionBalanceChanges` called once at page level (no duplicate fetch)
- [ ] `BalanceChangeTab` no longer fetches data internally
- [ ] New row appears after "Interacted With", before "Function"
- [ ] Row hidden when no relevant token transfers exist
- [ ] Inbound = green ↓ +amount, Outbound = red ↑ -amount
- [ ] "View full breakdown →" correctly switches to Balance Changes tab
- [ ] Clean `bun run build`
