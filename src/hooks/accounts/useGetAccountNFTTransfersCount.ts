import { useQuery } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";

export function useGetAccountNFTTransfersCount(
  address: string,
  activityType?: string | null,
): {
  isLoading: boolean;
  error: ResponseError | undefined;
  data: number | undefined;
} {
  const { network_value, sdk_v2_client } = useGlobalStore();

  const { isLoading, error, data } = useQuery<
    number | undefined,
    ResponseError
  >({
    queryKey: [
      "accountNFTTransfersCount",
      address,
      activityType ?? null,
      network_value,
    ],
    queryFn: async () => {
      try {
        const query = activityType
          ? `
            query GetAccountNFTTransfersCountByType($address: String!, $activityType: String!) {
              token_activities_v2_aggregate(
                where: {
                  _or: [
                    { from_address: { _eq: $address } }
                    { to_address: { _eq: $address } }
                  ]
                  type: { _eq: $activityType }
                }
              ) {
                aggregate {
                  count
                }
              }
            }
          `
          : `
            query GetAccountNFTTransfersCount($address: String!) {
              token_activities_v2_aggregate(
                where: {
                  _or: [
                    { from_address: { _eq: $address } }
                    { to_address: { _eq: $address } }
                  ]
                }
              ) {
                aggregate {
                  count
                }
              }
            }
          `;

        const variables: Record<string, unknown> = { address };
        if (activityType) {
          variables.activityType = activityType;
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
    enabled: !!address,
  });

  return {
    isLoading,
    error: error ?? undefined,
    data,
  };
}
