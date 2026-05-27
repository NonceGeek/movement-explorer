import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const PUBLIC_GECKOTERMINAL_BASE_URL =
  process.env.GECKOTERMINAL_API_BASE_URL ??
  "https://api.geckoterminal.com/api/v2";
const COINGECKO_ONCHAIN_BASE_URL =
  process.env.COINGECKO_ONCHAIN_API_BASE_URL ??
  "https://pro-api.coingecko.com/api/v3/onchain";
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const MOVEMENT_NETWORK_ID = "movement";
const MAX_ASSET_IDS = 100;
const PRICE_CACHE_SECONDS = 60;
const FAILED_CACHE_SECONDS = 30;
const ALLOWED_PRICE_API_HOSTS = new Set(
  (process.env.PRICE_API_ALLOWED_HOSTS ?? "")
    .split(",")
    .map(normalizeHost)
    .filter((host): host is string => Boolean(host)),
);

type GeckoTerminalPriceResponse = {
  data?: {
    attributes?: {
      token_prices?: Record<string, string>;
    };
  };
};

type PriceResult = {
  prices: Record<string, number>;
  source: "coingecko-pro" | "geckoterminal-public";
};

type FailedCacheEntry = {
  expiresAt: number;
  message: string;
  status: number;
};

const failedCache = new Map<string, FailedCacheEntry>();

function normalizeHost(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
      .host;
  } catch {
    return null;
  }
}

function normalizeAssetId(assetId: string): string | null {
  const trimmed = assetId.trim();
  if (!trimmed || trimmed.includes("::")) return null;

  const normalized = trimmed.toLowerCase();
  if (!/^0x[0-9a-f]+$/.test(normalized)) return null;

  return normalized;
}

function getHeaderHost(value: string | null): string | null {
  if (!value) return null;
  return normalizeHost(value.split(",")[0]);
}

function getUrlHost(value: string | null): string | null {
  if (!value) return null;

  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedRequestHost(host: string | null, requestHost: string | null) {
  if (!host) return true;
  return host === requestHost || ALLOWED_PRICE_API_HOSTS.has(host);
}

function isAllowedPriceRequest(request: NextRequest) {
  const requestHost =
    getHeaderHost(request.headers.get("x-forwarded-host")) ??
    getHeaderHost(request.headers.get("host")) ??
    request.nextUrl.host.toLowerCase();
  const originHost = getUrlHost(request.headers.get("origin"));
  const refererHost = getUrlHost(request.headers.get("referer"));
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") return false;

  return (
    isAllowedRequestHost(originHost, requestHost) &&
    isAllowedRequestHost(refererHost, requestHost)
  );
}

function getPriceEndpoint(assetIds: string[]) {
  if (COINGECKO_API_KEY) {
    const headers: Record<string, string> = {
      accept: "application/json",
      "x-cg-pro-api-key": COINGECKO_API_KEY,
    };

    return {
      source: "coingecko-pro" as const,
      url: `${COINGECKO_ONCHAIN_BASE_URL}/simple/networks/${MOVEMENT_NETWORK_ID}/token_price/${assetIds.join(",")}`,
      headers,
    };
  }

  const headers: Record<string, string> = {
    accept: "application/json",
  };

  return {
    source: "geckoterminal-public" as const,
    url: `${PUBLIC_GECKOTERMINAL_BASE_URL}/simple/networks/${MOVEMENT_NETWORK_ID}/token_price/${assetIds.join(",")}`,
    headers,
  };
}

async function fetchMovementTokenPrices(
  assetIdsKey: string,
): Promise<PriceResult> {
  const assetIds = assetIdsKey.split(",").filter(Boolean);
  const endpoint = getPriceEndpoint(assetIds);

  const response = await fetch(endpoint.url, {
    headers: endpoint.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch token prices: ${response.status}`);
  }

  const data = (await response.json()) as GeckoTerminalPriceResponse;
  const tokenPrices = data.data?.attributes?.token_prices ?? {};
  const prices: Record<string, number> = {};
  for (const [assetId, price] of Object.entries(tokenPrices)) {
    const numericPrice = Number(price);
    if (Number.isFinite(numericPrice) && numericPrice > 0) {
      prices[assetId.toLowerCase()] = numericPrice;
    }
  }

  return { prices, source: endpoint.source };
}

const getCachedMovementTokenPrices = unstable_cache(
  fetchMovementTokenPrices,
  ["movement-token-current-prices-v1"],
  { revalidate: PRICE_CACHE_SECONDS },
);

export async function GET(request: NextRequest) {
  if (!isAllowedPriceRequest(request)) {
    return NextResponse.json(
      { prices: {}, error: "Forbidden" },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          Vary: "Origin, Referer, Sec-Fetch-Site",
        },
      },
    );
  }

  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const assetIds = Array.from(
    new Set(
      idsParam
        .split(",")
        .map(normalizeAssetId)
        .filter((assetId): assetId is string => Boolean(assetId)),
    ),
  ).slice(0, MAX_ASSET_IDS);

  if (assetIds.length === 0) {
    return NextResponse.json({ prices: {} });
  }

  const assetIdsKey = assetIds.sort().join(",");
  const cachedFailure = failedCache.get(assetIdsKey);
  if (cachedFailure && cachedFailure.expiresAt > Date.now()) {
    return NextResponse.json(
      { prices: {}, error: cachedFailure.message },
      {
        status: cachedFailure.status,
        headers: {
          "Cache-Control": `public, s-maxage=${FAILED_CACHE_SECONDS}`,
        },
      },
    );
  }

  if (cachedFailure) {
    failedCache.delete(assetIdsKey);
  }

  try {
    const { prices, source } = await getCachedMovementTokenPrices(assetIdsKey);

    return NextResponse.json(
      { prices, source },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${PRICE_CACHE_SECONDS}, stale-while-revalidate=240`,
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch Movement token prices:", error);
    const message = "Failed to fetch token prices";
    failedCache.set(assetIdsKey, {
      expiresAt: Date.now() + FAILED_CACHE_SECONDS * 1000,
      message,
      status: 502,
    });

    return NextResponse.json(
      { prices: {}, error: message },
      {
        status: 502,
        headers: {
          "Cache-Control": `public, s-maxage=${FAILED_CACHE_SECONDS}`,
        },
      },
    );
  }
}
