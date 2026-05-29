# Explorer Legacy Sync And Fixes

**Date:** 2026-05-29  
**Status:** Implemented locally  
**Reference repo:** `/Users/fun/Documents/GitHub/explorer`  
**New repo:** `/Users/fun/Documents/GitHub/movement-explorer`

## Background

This change set started from comparing the old explorer from commit
`fa072ba1ad4132ab2e2ec2f7e346733bbacfc1a7` through the latest local code, then
porting selected fixes and behavior into the new explorer.

The main goals were:

- Make token search behavior match the current explorer, including `usdcx`.
- Align network naming and testnet handling with the current explorer.
- Port the Coin/Fungible Asset holders crash fix.
- Bring over validator and geo-data stability fixes.
- Add UI fixes found during local testing.
- Avoid client-side CoinGecko `429` by moving simple price calls behind a BFF cache.

## Changes Ported From Old Explorer

### Network Naming And Testnet Alignment

The user-facing network names now display as:

- `Mainnet`
- `Testnet`

The new explorer no longer exposes the old `Bardock Testnet` label in the
network selector. Legacy URL values are still accepted:

```text
network=bardock-testnet -> network=testnet
```

Affected files:

- `src/constants/networks.ts`
- `src/store/useGlobalStore.ts`
- `src/components/layout/NetworkSelect.tsx`
- `src/components/layout/NetworkBadge.tsx`
- `src/components/layout/NetworkUrlSync.tsx`
- `src/hooks/analytics/useGetAnalyticsData.ts`

### Coin And Fungible Asset Holders Crash Fix

The holders query was aligned with the old explorer fix:

- Query `amount` instead of `amount_v2`.
- Filter with `amount: {_is_null: false}`.
- Order by `amount: desc_nulls_last`.
- Render amounts using `BigInt(holder.amount)`.

This avoids crashes when holder values exceed JavaScript safe number limits or
when `amount_v2` is unavailable.

Affected files:

- `src/hooks/coins/useGetCoinHolders.ts`
- `src/app/coin/[struct]/components/HoldersTab.tsx`
- `src/app/fa/[address]/components/HoldersTab.tsx`

### Validator And Geo Data Stability

Validator logic was aligned with recent old-explorer updates:

- Removed legacy bardock-specific branches.
- Use testnet as the supported test network name.
- Filter empty `last_epoch_performance` values.
- Derive JSON validators with `useMemo`.
- Add safer async operator-address fallback handling.
- Avoid state updates inside `useMemo` in geo-data grouping.
- Treat geo data as available only when `validatorGeoGroups.length > 0`.

Affected files:

- `src/hooks/validators/useGetValidators.ts`
- `src/hooks/validators/useGetValidatorSetGeoData.ts`

## Search And Token Metadata Fixes

### Token Search Source

The new explorer previously searched local `/tokens.json`. The old explorer
uses the live Movement token list:

```text
https://raw.githubusercontent.com/movementlabsxyz/movement-tokens/refs/heads/main/tokens.json
```

The new explorer now uses the same live source.

Affected file:

- `src/constants/urls.ts`

### Search Result Limit

The token autocomplete previously sliced results to 5 entries, which could hide
valid matches such as `usdcx`. The slice was removed so matching tokens can
appear in the dropdown.

Affected file:

- `src/hooks/common/useSearch.ts`

## UI Fixes Added During Migration

### Token Icon Fallback

Broken token image URLs now fall back to a deterministic placeholder instead of
showing the browser broken-image icon.

Fallback behavior:

- Use token initials when possible.
- Use stable color selection based on the token symbol/name.
- Use a generic coin icon when no initials can be derived.

Affected files:

- `src/components/common/TokenIcon.tsx`
- `src/components/search/SearchBar.tsx`
- `src/components/layout/PageNavigation.tsx`
- `src/app/account/[address]/components/Tabs/coins/CoinIcons.tsx`

### Autocomplete Dropdown Clipping

The homepage search autocomplete could clip the last result because the parent
container used vertical overflow clipping. The wrapper was changed to allow the
dropdown to render fully.

Affected file:

- `src/app/(home)/page.tsx`

### Network Selector Sizing

After renaming networks to `Mainnet` / `Testnet`, both network dropdowns were
too wide. Widths were reduced:

- Primary header selector: trigger `120px`, dropdown `144px`.
- Sticky secondary selector: trigger `112px`, dropdown `136px`.

The dropdown content uses explicit important width and min-width values because
the design-system dropdown content can otherwise enforce a wider default.

Affected files:

- `src/components/layout/NetworkSelect.tsx`
- `src/components/layout/NetworkBadge.tsx`

## URL Network Persistence

The old explorer treats `network` as a global persistent URL parameter. The new
explorer now follows the same expectation:

- Visiting `?network=testnet` selects Testnet.
- Internal navigation preserves Testnet by adding `network=testnet` when needed.
- Switching back to Mainnet removes the `network` parameter.
- `network=bardock-testnet` is normalized to `network=testnet`.

A race was fixed after testing: switching from Testnet back to Mainnet could be
pulled back to Testnet by the stale URL query. The final implementation splits
URL-to-store and store-to-URL synchronization so dropdown changes are not
overridden by old query params.

Affected file:

- `src/components/layout/NetworkUrlSync.tsx`

## CoinGecko Simple Price BFF Cache

The browser was directly calling:

```text
https://api.coingecko.com/api/v3/simple/price
```

This often returned `429 Too Many Requests`. The direct browser request was
replaced with a server-side BFF:

```text
GET /api/prices/simple?ids=movement&vs_currencies=usd&include_market_cap=true&include_24hr_change=true
```

Route behavior:

- Proxies CoinGecko simple prices server-side.
- Uses `COINGECKO_API_KEY` if available.
- Caches successful responses for 5 minutes.
- Adds HTTP cache header `s-maxage=300, stale-while-revalidate=600`.
- Short-caches failures for 30 seconds.
- Aborts slow upstream requests after 8 seconds.
- Limits batch size to 250 CoinGecko IDs.

Affected files:

- `src/app/api/prices/simple/route.ts`
- `src/hooks/useGetPrice.ts`
- `src/hooks/coins/useGetCoinList.ts`
- `src/constants/urls.ts`

Note: the existing Movement on-chain token price BFF remains separate:

```text
GET /api/prices/movement?ids=...
```

That route is documented in:

- `docs/plans/2026-05-27-token-current-price-bff.md`

## Local Verification

Focused checks run during this work:

```text
pnpm exec tsc --noEmit
pnpm exec eslint src/components/layout/NetworkUrlSync.tsx
pnpm exec eslint src/components/layout/NetworkSelect.tsx
pnpm exec eslint src/components/layout/NetworkBadge.tsx
pnpm exec eslint src/app/api/prices/simple/route.ts src/hooks/useGetPrice.ts src/hooks/coins/useGetCoinList.ts src/constants/urls.ts
pnpm exec prettier --check src/components/layout/NetworkUrlSync.tsx
pnpm exec prettier --check src/components/layout/NetworkSelect.tsx
pnpm exec prettier --check src/components/layout/NetworkBadge.tsx
pnpm exec prettier --check src/app/api/prices/simple/route.ts src/hooks/useGetPrice.ts src/hooks/coins/useGetCoinList.ts src/constants/urls.ts
```

Manual/local observations:

- `http://localhost:2222/` is the active local dev server.
- `/api/prices/simple` responds locally and shields the browser from direct
  CoinGecko calls.
- When the upstream price API is unavailable/rate-limited, the route returns a
  short-cached `502` instead of hanging the browser request.

## Follow-Up Notes

- The simple-price BFF is a cache, not a full rate limiter. Deployment-side rate
  limits or shared Redis/KV cache may be needed if public traffic grows.
- Internal links are still mostly plain Next.js `Link` / `router.push` calls.
  `NetworkUrlSync` currently provides the global safety net. A future cleanup
  could introduce a shared `useNetworkHref()` or wrapped `Link`.
- If `COINGECKO_API_KEY` is not configured, upstream rate limits may still affect
  server-side refreshes, but the blast radius is reduced by cache and failure
  throttling.
