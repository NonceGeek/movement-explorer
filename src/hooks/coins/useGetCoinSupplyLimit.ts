import { useEffect, useState } from "react";
import { useViewFunction } from "../common/useViewFunction";

export enum SupplyType {
  ON_CHAIN = "On-Chain",
  VERIFIED_OFF_CHAIN = "Verified Off-Chain",
  NO_SUPPLY_TRACKED = "No supply tracked",
}

export function useGetCoinSupplyLimit(coinType: string): {
  isLoading: boolean;
  data: [bigint | null, SupplyType | null];
} {
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null);
  const [supplyType, setSupplyType] = useState<SupplyType | null>(null);

  const { isLoading, data } = useViewFunction(
    "0x1::coin::supply",
    [coinType],
    []
  );

  useEffect(() => {
    if (data !== undefined) {
      // Parse supply
      const mappedData = data as [{ vec: [string] }];
      const val = mappedData[0]?.vec[0];

      if (val !== undefined && val !== null) {
        setTotalSupply(BigInt(val));
        setSupplyType(SupplyType.ON_CHAIN);
      } else {
        setTotalSupply(null);
        setSupplyType(SupplyType.NO_SUPPLY_TRACKED);
      }
    }
  }, [data]);

  return { isLoading, data: [totalSupply, supplyType] };
}
