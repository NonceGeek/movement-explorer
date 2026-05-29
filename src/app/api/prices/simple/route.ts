import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const COINGECKO_SIMPLE_PRICE_URL =
  process.env.COINGECKO_SIMPLE_PRICE_URL ??
  "https://api.coingecko.com/api/v3/simple/price";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const MAX_COIN_IDS = 250;
const PRICE_CACHE_SECONDS = 5 * 60;
const FAILED_CACHE_SECONDS = 30;
const UPSTREAM_TIMEOUT_MS = 8_000;

type SimplePriceData = Record<
  string,
  {
    usd?: number;
    usd_market_cap?: number;
    usd_24h_change?: number;
  }
>;

type FailedCacheEntry = {
  expiresAt: number;
  message: string;
  status: number;
};

const failedCache = new Map<string, FailedCacheEntry>();

function normalizeCoinId(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || !/^[a-z0-9][a-z0-9-]*$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function getBooleanParam(request: NextRequest, name: string): boolean {
  return request.nextUrl.searchParams.get(name) === "true";
}

function getCacheKey(
  ids: string[],
  includeMarketCap: boolean,
  include24hChange: boolean,
) {
  return [
    ids.sort().join(","),
    includeMarketCap ? "marketCap" : "noMarketCap",
    include24hChange ? "change24h" : "noChange24h",
  ].join("|");
}

async function fetchSimplePrices(cacheKey: string): Promise<SimplePriceData> {
  const [ids, marketCapFlag, change24hFlag] = cacheKey.split("|");
  const query = new URLSearchParams({
    ids,
    vs_currencies: "usd",
  });

  if (marketCapFlag === "marketCap") {
    query.set("include_market_cap", "true");
  }
  if (change24hFlag === "change24h") {
    query.set("include_24hr_change", "true");
  }

  const headers: Record<string, string> = {
    accept: "application/json",
  };
  if (COINGECKO_API_KEY) {
    headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${COINGECKO_SIMPLE_PRICE_URL}?${query}`, {
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch simple prices: ${response.status}`);
  }

  return (await response.json()) as SimplePriceData;
}

const getCachedSimplePrices = unstable_cache(
  fetchSimplePrices,
  ["coingecko-simple-prices-v1"],
  { revalidate: PRICE_CACHE_SECONDS },
);

export async function GET(request: NextRequest) {
  const ids = Array.from(
    new Set(
      (request.nextUrl.searchParams.get("ids") ?? "")
        .split(",")
        .map(normalizeCoinId)
        .filter((id): id is string => Boolean(id)),
    ),
  ).slice(0, MAX_COIN_IDS);

  if (ids.length === 0) {
    return NextResponse.json({});
  }

  const cacheKey = getCacheKey(
    ids,
    getBooleanParam(request, "include_market_cap"),
    getBooleanParam(request, "include_24hr_change"),
  );

  const cachedFailure = failedCache.get(cacheKey);
  if (cachedFailure && cachedFailure.expiresAt > Date.now()) {
    return NextResponse.json(
      { error: cachedFailure.message },
      {
        status: cachedFailure.status,
        headers: {
          "Cache-Control": `public, s-maxage=${FAILED_CACHE_SECONDS}`,
        },
      },
    );
  }

  if (cachedFailure) {
    failedCache.delete(cacheKey);
  }

  try {
    const data = await getCachedSimplePrices(cacheKey);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${PRICE_CACHE_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch (error) {
    console.error("Failed to fetch CoinGecko simple prices:", error);
    const message = "Failed to fetch simple prices";
    failedCache.set(cacheKey, {
      expiresAt: Date.now() + FAILED_CACHE_SECONDS * 1000,
      message,
      status: 502,
    });

    return NextResponse.json(
      { error: message },
      {
        status: 502,
        headers: {
          "Cache-Control": `public, s-maxage=${FAILED_CACHE_SECONDS}`,
        },
      },
    );
  }
}
