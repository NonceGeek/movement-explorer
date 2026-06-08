import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";
import { tryStandardizeAddress } from "@/utils";

export function useGetAccountNFTTransfersCount(
  address: string,
  activityType?: string | null,
  timestampGte?: string | null,
  timestampLte?: string | null,
): {
  isLoading: boolean;
  error: ResponseError | undefined;
  data: number | undefined;
} {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const normalizedAddress = tryStandardizeAddress(address);

  const hasActivity = !!activityType;
  const hasTimestamp = !!timestampGte && !!timestampLte;

  const { isLoading, error, data } = useQuery<
    number | undefined,
    ResponseError
  >({
    queryKey: [
      "accountNFTTransfersCount",
      normalizedAddress ?? address,
      activityType ?? null,
      timestampGte ?? null,
      timestampLte ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        if (!normalizedAddress) return undefined;

        const varParts = ["$address: String!"];
        if (hasActivity) varParts.push("$activityType: String!");
        if (hasTimestamp) {
          varParts.push("$timestampGte: timestamp");
          varParts.push("$timestampLte: timestamp");
        }

        const whereParts = [
          `_or: [
            { from_address: { _eq: $address } }
            { to_address: { _eq: $address } }
          ]`,
        ];
        if (hasActivity) whereParts.push("type: { _eq: $activityType }");
        if (hasTimestamp) {
          whereParts.push(
            "transaction_timestamp: { _gte: $timestampGte, _lte: $timestampLte }",
          );
        }

        const query = `
          query GetAccountNFTTransfersCount(${varParts.join(", ")}) {
            token_activities_v2_aggregate(
              where: { ${whereParts.join(", ")} }
            ) {
              aggregate {
                count
              }
            }
          }
        `;

        const variables: Record<string, unknown> = {
          address: normalizedAddress,
        };
        if (hasActivity) variables.activityType = activityType;
        if (hasTimestamp) {
          variables.timestampGte = timestampGte;
          variables.timestampLte = timestampLte;
        }

        const result = await sdk_v2_client.queryIndexer<{
          token_activities_v2_aggregate: {
            aggregate: { count: number };
          };
        }>({
          query: { query, variables },
        });

        return result.token_activities_v2_aggregate?.aggregate?.count;
      } catch (e) {
        console.error("NFT transfers count fetch failed:", e);
        return undefined;
      }
    },
    enabled: !!normalizedAddress,
  });

  return {
    isLoading,
    error: error ?? undefined,
    data,
  };
}
