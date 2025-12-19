import { Types } from "aptos";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";
import { view } from "../../services";

export function useViewFunction(
  functionName: string,
  typeArgs: string[],
  args: string[]
): UseQueryResult<Types.MoveValue[], ResponseError> {
  const { network_value, aptos_client } = useGlobalStore();

  const request: Types.ViewRequest = {
    function: functionName,
    type_arguments: typeArgs,
    arguments: args,
  };

  return useQuery<Types.MoveValue[], ResponseError>({
    queryKey: ["viewFunction", { functionName, typeArgs, args }, network_value],
    queryFn: () => view(request, aptos_client),
    refetchOnWindowFocus: false,
  });
}
