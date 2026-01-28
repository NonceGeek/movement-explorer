import { Types } from "aptos";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getAccountTransactions } from "../../services";
import { ResponseError } from "../../utils/api-client";
import { useGlobalStore } from "../../store/useGlobalStore";

export function useGetAccountTransactions(
  address: string,
  start?: number,
  limit?: number,
  offset?: number
): UseQueryResult<Array<Types.Transaction>, ResponseError> {
  const { network_value, aptos_client, sdk_v2_client } = useGlobalStore();

  return useQuery<Array<Types.Transaction>, ResponseError>({
    queryKey: [
      "accountTransactions",
      { address, start, limit, offset },
      network_value,
    ],
    queryFn: async () => {
      // Try fetching from Indexer first if available
      try {
        const result = await sdk_v2_client.queryIndexer<{
          account_transactions: Array<{
            transaction_version: number;
            user_transaction: any;
          }>;
        }>({
          query: {
            query: `
              query AccountTransactions($address: String, $limit: Int, $offset: Int) {
                account_transactions(
                  where: {account_address: {_eq: $address}}
                  order_by: {transaction_version: desc}
                  limit: $limit
                  offset: $offset
                ) {
                  transaction_version
                  user_transaction {
                    entry_function_id_str
                    expiration_timestamp_secs
                    gas_unit_price
                    max_gas_amount
                    sender
                    sequence_number
                    timestamp
                    version
                  }
                }
              }
            `,
            variables: { address, limit: limit || 25, offset: offset || 0 },
          },
        });

        if (result.account_transactions && result.account_transactions.length > 0) {
          // Map v2 indexer response to v1 Transaction type for compatibility
          // Note: This is a partial mapping sufficient for the UI list
          // For full details, we might need to fetch individual txns or expand the query
          return result.account_transactions.map((record) => {
            const tx = record.user_transaction;
            
            // If the user_transaction is null (which can happen for some tx types), 
            // construct a basic object or fallback.
            // However, account_transactions usually implies user txns.
            if (!tx) {
                return {
                    version: record.transaction_version.toString(),
                    type: "user_transaction",
                    success: true, // simplified assumption or need extra field
                    hash: "", // not in this query, might need to add
                    sender: "",
                    sequence_number: "0",
                    max_gas_amount: "0",
                    gas_unit_price: "0", 
                    expiration_timestamp_secs: "0",
                    payload: {} as any
                } as Types.Transaction;
            }

            return {
              version: tx.version.toString(),
              hash: "",  // Not strictly needed for list view if we link by version
              type: "user_transaction",
              success: true, // We might need to query 'success' field if important for list
              sender: tx.sender,
              sequence_number: tx.sequence_number.toString(),
              max_gas_amount: tx.max_gas_amount.toString(),
              gas_unit_price: tx.gas_unit_price.toString(),
              expiration_timestamp_secs: tx.expiration_timestamp_secs.toString(),
              timestamp: tx.timestamp ? (BigInt(tx.timestamp.microseconds || tx.timestamp) ).toString() : undefined, // Adjust based on actual format
              payload: {
                type: "entry_function_payload",
                function: tx.entry_function_id_str,
                arguments: [],
                type_arguments: []
              } as any
            } as Types.Transaction;
          });
        }
      } catch (e) {
        console.warn("Indexer fetch failed, falling back to Node API", e);
      }

      // Fallback to Node API (only sent transactions)
      return getAccountTransactions(
        { address, start, limit },
        aptos_client
      );
    },
  });
}
