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
