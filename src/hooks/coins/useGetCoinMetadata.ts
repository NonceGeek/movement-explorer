import { CoinData } from "../../types";
import { useGetAccountResource } from "../accounts/useGetAccountResource";

export function useGetCoinMetadata(coinType: string): {
  isLoading: boolean;
  data: CoinData | null;
} {
  const { data, isLoading } = useGetAccountResource(
    coinType,
    `0x1::coin::CoinInfo<${coinType}>`
  );

  if (data) {
    const val = data as unknown as CoinData;
    if (val !== undefined && val !== null) {
      return { isLoading, data: val };
    }
  }

  return { isLoading, data: null };
}
