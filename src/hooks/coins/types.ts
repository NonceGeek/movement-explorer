/**
 * Coin description type from token list
 */
export type CoinDescription = {
  chainId: number;
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  bridge: string | null;
  panoraSymbol: string | null;
  logoUrl: string;
  websiteUrl: string | null;
  category: string;
  panoraUI: boolean;
  isInPanoraTokenList: boolean;
  isBanned: boolean;
  panoraOrderIndex?: number;
  panoraIndex?: number;
  coinGeckoId: string | null;
  coinMarketCapId: number | null;
  usdPrice: string | null;
  panoraTags: (
    | "Native"
    | "Bridged"
    | "Emojicoin"
    | "Meme"
    | "Verified"
    | "Recognized"
    | "Unverified"
    | "Banned"
    | "InternalFA"
    | "LP"
  )[];
  native?: boolean;
};

/**
 * Movement verified token from GitHub repo
 */
export interface MovementVerifiedToken {
  chainId: number;
  tokenAddress: string | null;
  faAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  bridge?: string | null;
  logoUrl: string;
  websiteUrl: string;
  coinGeckoId?: string;
  coinMarketCapId?: number;
}

/**
 * Hardcoded coins for fallback
 */
export const HardCodedCoins: Record<string, CoinDescription> = {
  "0x1::aptos_coin::AptosCoin": {
    chainId: 126,
    tokenAddress: "0x1::aptos_coin::AptosCoin",
    faAddress: "0xa",
    name: "MOVE Coin",
    symbol: "MOVE",
    decimals: 8,
    panoraSymbol: "MOVE",
    bridge: null,
    logoUrl: "/logo.png",
    websiteUrl: "https://movementnetwork.xyz",
    category: "Native",
    isInPanoraTokenList: false,
    panoraUI: false,
    usdPrice: null,
    panoraTags: ["Native"],
    isBanned: false,
    panoraOrderIndex: 1,
    panoraIndex: 1,
    coinGeckoId: "movement",
    coinMarketCapId: 32452,
    native: true,
  },
  "0x000000000000000000000000000000000000000000000000000000000000000a": {
    chainId: 126,
    tokenAddress: "0xa",
    faAddress: "0xa",
    name: "MOVE Coin",
    symbol: "MOVE",
    decimals: 8,
    panoraSymbol: "MOVE",
    bridge: null,
    logoUrl: "/logo.png",
    websiteUrl: "https://movementnetwork.xyz",
    category: "Native",
    isInPanoraTokenList: false,
    panoraUI: false,
    usdPrice: null,
    panoraTags: ["InternalFA"],
    isBanned: false,
    panoraOrderIndex: 1,
    panoraIndex: 1,
    coinGeckoId: "movement",
    coinMarketCapId: 32452,
    native: true,
  },
};

/**
 * Emojicoin registry address
 */
export const EMOJICOIN_REGISTRY_ADDRESS =
  "0x4b947ed016c64bde81972d69ea7d356de670d57fd2608b129f4d94ac0d0ee61";
