import { CoinDescription } from "@/types/coin";

/**
 * Coin overrides
 */
// This provides a way to hardcode coins that are not in the token list, but still
// have functionality used elsewhere
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
    logoUrl: "/coinLogo.png",
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
    logoUrl: "/coinLogo.png",
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
 * Coin supply limit overrides
 */
export const supplyLimitOverrides: Record<string, bigint> = {};

export const nativeTokens: Record<string, string> = {
  "0x1::aptos_coin::AptosCoin": "MOVE",
  "0x000000000000000000000000000000000000000000000000000000000000000a": "MOVE",
  "0x000000000000000000000000000000000000000000000000000000000000000A": "MOVE",
  "0xa": "MOVE",
  "0xA": "MOVE",
};
