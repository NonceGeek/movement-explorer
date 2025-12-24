import { Hex } from "@aptos-labs/ts-sdk";
import { Types } from "aptos";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { view } from "@/services";
import { useGlobalStore } from "@/store/useGlobalStore";
import { isValidAccountAddress } from "@/utils";

const TEXT_DECODER = new TextDecoder();

export function useGetFaPairedCoin(
  address: string
): UseQueryResult<string | undefined, ResponseError> {
  const { network_value, aptos_client } = useGlobalStore();
  const request: Types.ViewRequest = {
    function: "0x1::coin::paired_coin",
    type_arguments: [],
    arguments: [address],
  };

  return useQuery<string | undefined, ResponseError>({
    queryKey: ["pairedCoin", address, network_value],
    queryFn: async () => {
      if (isValidAccountAddress(address)) {
        const data = await view(request, aptos_client);
        if (data !== undefined) {
          const mappedData = data as [
            {
              vec: [
                {
                  account_address: string;
                  module_name: string;
                  struct_name: string;
                }
              ];
            }
          ];
          const val = mappedData[0]?.vec[0];
          if (val !== undefined && val !== null) {
            return `${val.account_address}::${hexToUtf8(
              val.module_name
            )}::${hexToUtf8(val.struct_name)}`;
          }
        }
      }
      return undefined;
    },
  });
}

function hexToUtf8(hexWith0x: string): string {
  return TEXT_DECODER.decode(Hex.fromHexString(hexWith0x).toUint8Array());
}
