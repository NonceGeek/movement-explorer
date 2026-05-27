# Token Current Price BFF

**Date:** 2026-05-27
**Status:** Implemented

## Problem

Explorer needs Etherscan-style token current price display in transaction detail views:

- Token Transfers in the transaction overview should show current USD value and a `Current Price` tooltip.
- Balance Changes should show USD value and the same current price tooltip.
- Fungible Asset detail pages should use the same price source as transaction detail pages.

Previously, different surfaces could use different price sources:

- FA / coin overview used `useGetCoinList()`, which maps token list `coinGeckoId` values to CoinGecko simple prices.
- Transaction transfer displays needed Movement on-chain token prices by FA address.

For bridged assets such as `USDC.e`, these sources can differ. The intended behavior is to prefer Movement on-chain prices and use token-list/CoinGecko prices only as fallback.

## Decision

Use one BFF route for current token prices:

```text
GET /api/prices/movement?ids=0xa,0x...
```

The route runs server-side and proxies Movement on-chain price data from:

- CoinGecko Pro on-chain API when `COINGECKO_API_KEY` is configured
- GeckoTerminal public API as the default fallback

Client modules use this BFF consistently through:

```text
useGetMovementTokenPrices(assetIds)
```

## Why BFF Instead of SSR

The current app is mostly client-data driven. In particular, transaction token transfers are derived from client-side GraphQL activity data, so token IDs are not always known at initial server render time.

BFF is preferred for this phase because:

- It keeps one price pipeline for FA pages, transaction overview, and balance changes.
- It avoids converting transaction pages to server data loaders.
- It keeps API keys server-side.
- It allows React Query to cache and refresh current prices naturally.
- Price data is progressive enhancement; chain data remains usable if price lookup fails.

SSR can be reconsidered later if transaction detail data is moved server-side.

## Data Flow

```text
UI component
  -> useGetMovementTokenPrices(assetIds)
    -> /api/prices/movement?ids=...
      -> CoinGecko Pro on-chain API, if COINGECKO_API_KEY exists
      -> GeckoTerminal public API otherwise
```

All supported surfaces should prefer BFF on-chain prices:

1. Transaction overview `Token Transfers`
2. Transaction `Balance Changes`
3. Fungible Asset overview `Price` and `Market Cap`

Token-list `usdPrice` is fallback only.

## API Route Behavior

File:

```text
src/app/api/prices/movement/route.ts
```

### Input

`ids` is a comma-separated list of Movement FA addresses.

Rules:

- Empty or invalid IDs are ignored.
- Struct coin types such as `0x1::aptos_coin::AptosCoin` are ignored by the BFF; callers should pass the paired FA address when available.
- Duplicates are removed.
- IDs are lowercased.
- Maximum IDs per request: `100`.

### Output

```json
{
  "prices": {
    "0xa": 0.01560494
  },
  "source": "geckoterminal-public"
}
```

`source` can be:

- `coingecko-pro`
- `geckoterminal-public`

On failure:

```json
{
  "prices": {},
  "error": "Failed to fetch token prices"
}
```

## Caching

The BFF route uses multiple cache layers:

| Layer                 |                     TTL | Purpose                                                            |
| --------------------- | ----------------------: | ------------------------------------------------------------------ |
| Next `unstable_cache` |                     60s | Share successful upstream responses across route calls             |
| HTTP `Cache-Control`  |        60s + stale 240s | Let platform/CDN cache successful responses                        |
| Failure cache         |                     30s | Avoid repeated upstream calls during rate limits/outages           |
| React Query           | 60s stale, 5min refetch | Avoid repeated browser requests while keeping current prices fresh |

Current prices are not meant to be tick-level real-time. A 60s server cache is acceptable for explorer display.

## Security And Abuse Protection

The BFF route is public because browser clients call it directly. It must not expose upstream API keys.

Current protections:

- `COINGECKO_API_KEY` is only used server-side.
- Same-origin checks reject cross-site browser requests.
- `PRICE_API_ALLOWED_HOSTS` can allow additional first-party hosts.
- `MAX_ASSET_IDS` limits batch size.
- Successful responses are cached.
- Failed responses are short-cached.

Environment variables:

```text
COINGECKO_API_KEY=
COINGECKO_ONCHAIN_API_BASE_URL=https://pro-api.coingecko.com/api/v3/onchain
GECKOTERMINAL_API_BASE_URL=https://api.geckoterminal.com/api/v2
PRICE_API_ALLOWED_HOSTS=explorer.movementnetwork.xyz,staging.example.com
```

Same-origin protection is not a full rate limit. If price traffic grows, add deployment-side rate limiting or shared KV/Redis counters.

## UI Behavior

### Transaction Overview: Token Transfers

Show current USD value inline:

```text
From 0x... -> To 0x...  0.00000129 (<$0.01) [icon] MOVE
```

Hover tooltip:

```text
Current Price: $0.01560494 / MOVE
```

Token icon is displayed next to the symbol. The icon uses token metadata when available and falls back to generated token initials.

### Balance Changes

Show USD value beside the amount:

```text
+0.038314 WETH.e ($87.35)
```

Hover tooltip:

```text
Current Price: $2,279.82 / WETH.e
```

### Fungible Asset Overview

Use Movement on-chain price first:

```text
Price       $0.999335
Market Cap  $915,xxx
```

Fallback to token-list/CoinGecko simple price only when no on-chain price is available.

## Implementation Files

| File                                                          | Purpose                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/app/api/prices/movement/route.ts`                        | BFF route, upstream proxy, cache, same-origin protection      |
| `src/hooks/coins/useGetMovementTokenPrices.ts`                | React Query hook for batch current prices                     |
| `src/app/txn/[hash]/components/FungibleAssetTransfersRow.tsx` | Overview token transfers current price, USD value, token icon |
| `src/app/txn/[hash]/components/BalanceChangeTab.tsx`          | Fetch prices for balance change assets, prefer on-chain price |
| `src/app/txn/[hash]/components/BalanceChangeTable.tsx`        | Display USD value and current price tooltip                   |
| `src/app/fa/[address]/[[...tab]]/page.tsx`                    | Fetch FA page on-chain price                                  |
| `src/app/fa/[address]/components/FAOverview.tsx`              | Accept explicit price prop and fallback to token-list price   |

## Non-Goals

- Historical transaction-time market price.
- Swap execution price derivation.
- Full SSR migration for transaction detail pages.
- Global portfolio pricing correctness for every token.

## Future Work

- Add Redis/KV or gateway-level rate limiting for `/api/prices/movement`.
- Add a server-only price service wrapper if more server components need price data.
- Add historical price support separately:
  - Prefer transaction-derived execution price for swaps.
  - Use on-chain OHLCV for non-swap historical market price when needed.
