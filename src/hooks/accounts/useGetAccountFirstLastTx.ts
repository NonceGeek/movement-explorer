import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ResponseError } from "@/utils/api-client";
import { useGlobalStore } from "@/store/useGlobalStore";
import { standardizeAddress } from "@/utils";

export interface AccountTimeline {
  firstSeenVersion: number;
  firstSeenTimestamp: string; // microseconds
  lastSeenVersion: number;
  lastSeenTimestamp: string; // microseconds
  activeDays: number;
}

/**
 * Get the first and last transaction timestamps for an account.
 * Queries the indexer for the earliest and latest transaction versions,
 * then fetches full transaction details to extract timestamps.
 */
export function useGetAccountFirstLastTx(
  address: string,
): UseQueryResult<AccountTimeline | null, ResponseError> {
  const { network_value, sdk_v2_client } = useGlobalStore();
  const addr64Hash = standardizeAddress(address);

  return useQuery<AccountTimeline | null, ResponseError>({
    queryKey: ["accountFirstLastTx", address, network_value],
    queryFn: async () => {
      try {
        // Query first and last transaction versions in a single request
        const result = await sdk_v2_client.queryIndexer<{
          first: Array<{ transaction_version: number }>;
          last: Array<{ transaction_version: number }>;
        }>({
          query: {
            query: `
              query AccountFirstLastTx($address: String) {
                first: account_transactions(
                  where: { account_address: { _eq: $address } }
                  order_by: { transaction_version: asc }
                  limit: 1
                ) {
                  transaction_version
                }
                last: account_transactions(
                  where: { account_address: { _eq: $address } }
                  order_by: { transaction_version: desc }
                  limit: 1
                ) {
                  transaction_version
                }
              }
            `,
            variables: { address: addr64Hash },
          },
        });

        const firstVersion = result.first?.[0]?.transaction_version;
        const lastVersion = result.last?.[0]?.transaction_version;

        if (firstVersion == null || lastVersion == null) {
          return null;
        }

        // Fetch full transaction details to get timestamps
        const [firstTx, lastTx] = await Promise.all([
          sdk_v2_client.getTransactionByVersion({
            ledgerVersion: firstVersion,
          }),
          firstVersion === lastVersion
            ? Promise.resolve(null)
            : sdk_v2_client.getTransactionByVersion({
                ledgerVersion: lastVersion,
              }),
        ]);

        const firstTimestamp = (firstTx as { timestamp?: string }).timestamp;
        const lastTimestamp = lastTx
          ? (lastTx as { timestamp?: string }).timestamp
          : firstTimestamp;

        if (!firstTimestamp || !lastTimestamp) {
          return null;
        }

        // Calculate active days
        const firstMs = parseInt(firstTimestamp) / 1000;
        const lastMs = parseInt(lastTimestamp) / 1000;
        const activeDays = Math.max(
          0,
          Math.floor((lastMs - firstMs) / (1000 * 60 * 60 * 24)),
        );

        return {
          firstSeenVersion: firstVersion,
          firstSeenTimestamp: firstTimestamp,
          lastSeenVersion: lastVersion,
          lastSeenTimestamp: lastTimestamp,
          activeDays,
        };
      } catch (e) {
        console.error("Failed to fetch account first/last transaction:", e);
        return null;
      }
    },
    enabled: !!address,
    staleTime: 60 * 1000, // 1 minute
  });
}
