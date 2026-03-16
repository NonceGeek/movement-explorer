# Design: Fungible Asset Transfers in Transaction Overview

**Date:** 2026-03-16
**Status:** Approved

## Problem

The transaction overview page has a Transaction Actions card (TL;DR summary) and a Balance Changes tab (full detail), but nothing in between. Users who want to see "which tokens moved" must find the Balance Changes tab themselves. Etherscan surfaces this inline in the overview.

## Solution

Add a **"Fungible Asset Transfers"** row inside `TransactionDetailsTable`, positioned after "Interacted With" and before "Function". This fills the gap between the summary and the full detail tab.

## Design Decisions

### Placement
Inside `TransactionDetailsTable`, after the `Interacted With` / `To` row, before `Function`. Matches Etherscan's layout.

### Display Condition
Show when `fungible_asset_activities` exist and, after filtering out `GasFeeEvent` entries, the list is non-empty. MOVE native transfers are included.

### Display Format (Approach B — sender-centric)
Do NOT attempt from→to pairing (Movement has separate Withdraw/Deposit events, pairing is unreliable for multi-hop swaps). Instead show sender-relative in/out:

```
Fungible Asset Transfers  (3)
  ↓ +1.43983644  MOVE
  ↑ -0.03103     USDT.e
                          View full breakdown →
```

- `↓` green for inbound (Deposit to sender)
- `↑` red/muted for outbound (Withdraw from sender)
- Gas fee movements excluded (already shown in Transaction Fee row)
- Token logo + symbol where available

### No All/Net Toggle
Balance Changes tab already provides this. Overview section is intentionally lightweight.

### "View full breakdown" Link
Small right-aligned text link at bottom of the section, navigates to the Balance Changes tab. Improves discoverability without cluttering the overview.

### Data Source
Lift `useGetTransactionBalanceChanges` from `BalanceChangeTab` up to `page.tsx`. Pass the data down to both:
- `TransactionDetailsTable` (new prop: `fungibleAssetActivities`)
- `BalanceChangeTab` (existing usage, now receives data as prop instead of fetching itself)

This avoids duplicate API calls.

## Affected Files

- `src/app/txn/[hash]/[[...tab]]/page.tsx` — lift API call, pass data down
- `src/app/txn/[hash]/components/TransactionDetailsTable.tsx` — add new row + new prop
- `src/app/txn/[hash]/components/BalanceChangeTab.tsx` — accept data as prop instead of fetching
- `src/hooks/transactions/useGetTransactionBalanceChanges.ts` — verify it can be used at page level
- New component: `src/app/txn/[hash]/components/FungibleAssetTransfersRow.tsx`
