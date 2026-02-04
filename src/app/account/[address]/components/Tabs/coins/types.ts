import { VerifiedLevelInfo } from "@/utils/coinVerification";

export type CoinRow = {
  assetType: string;
  name: string;
  symbol: string;
  decimals: number;
  tokenStandard: "v1" | "v2";
  amount: number;
  usdPrice: number | null;
  usdValue: number | null;
  verification: VerifiedLevelInfo;
  logoUrl: string | null;
};

export type CoinFilter = "verified" | "recognized" | "all";
