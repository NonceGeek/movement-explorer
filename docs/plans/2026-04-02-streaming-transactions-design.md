# Streaming Transaction Rendering

## Problem

Transaction list pages (UserTransactions, AccountTransactions) fetch all transaction details via `Promise.all()` and render them at once. This creates an all-or-nothing loading experience.

## Solution

Create a `useStreamingTransactions` hook that fetches each transaction independently and renders rows as they resolve, sorted by version descending.

## Scope

- **In scope**: UserTransactions, AccountTransactions (two-phase fetch: versions → details)
- **Out of scope**: AllTransactions (single REST batch), BlockTransactions (single REST call)

## Hook API

```typescript
// src/hooks/transactions/useStreamingTransactions.ts

interface UseStreamingTransactionsResult {
  transactions: TransactionRowData[];  // sorted desc by version, grows incrementally
  loadedCount: number;
  totalCount: number;
  isStreaming: boolean;
  isComplete: boolean;
}

function useStreamingTransactions(
  versions: number[] | undefined,
  client: AptosClient,
  enabled?: boolean
): UseStreamingTransactionsResult
```

### Behavior

1. When `versions` changes (page nav, filter change): clear state, restart
2. Each version triggers an independent `getTransaction()` call
3. On resolve: insert into state at correct sorted position (descending)
4. Stale request guard: ref tracks current versions key, ignores results from previous pages

## Component Changes

### UserTransactions
- Remove the `useQuery` wrapping `Promise.all`
- Use `useStreamingTransactions(versions, aptos_client)`
- `isLoading` = versionsLoading && no streamed transactions yet
- `TableLoadingBar.visible` = `isStreaming`

### AccountTransactions
- Same replacement pattern

### TransactionTable
- No changes needed. Existing `animate-in slide-in-from-top-2 fade-in` animation applies to each newly mounted row automatically.

## Page Navigation UX

On page change: versions change → hook clears → skeleton briefly shown → rows stream in one by one.
