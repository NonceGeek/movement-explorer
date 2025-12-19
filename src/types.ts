export type CoinDescription = {
  chainId: number; // Chain id (1 if mainnet) TODO: Handle across all of explorer to filter based on testnet / mainnet
  tokenAddress: string | null; // This is a coin address (if it exists)
  faAddress: string | null; // This is the FA address (if it exists)
  name: string; // Full name of the coin
  symbol: string; // symbol of coin
  decimals: number; // number of decimals (u8)
  bridge: string | null; // bridge name it came from if applicable
  panoraSymbol: string | null; // panora symbol (to handle bridged tokens)
  logoUrl: string; // Logo URL of the token
  websiteUrl: string | null; // Website URL of the token
  category: string; // Category of the token, which is not always filled
  panoraUI: boolean; // This is whether it shows at all on the panora UI
  isInPanoraTokenList: boolean; // This is whether it shows on panora, not usually necessary
  isBanned: boolean; // if it's banned by panora
  panoraOrderIndex?: number; // Order index in panora (doesn't look like it still applies)
  panoraIndex?: number; // Order index in panora (replaced panoraOrderIndex)
  coinGeckoId: string | null; // Pricing source info
  coinMarketCapId: number | null; // Pricing source info
  usdPrice: string | null; // Decimal string of the USD price
  panoraTags: string[]; // Kind of coin
  native?: boolean; // Added for our own purposes, not from Panora
};

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

export interface CoinData {
  type: string;
  data: {
    decimals: number;
    name: string;
    supply: {
      vec: [
        {
          aggregator: {
            vec: [
              {
                handle: string;
                key: string;
                limit: string;
              }
            ];
          };
          integer: { vec: [{ limit: string; value: string }] };
        }
      ];
    };
    symbol: string;
  };
}
