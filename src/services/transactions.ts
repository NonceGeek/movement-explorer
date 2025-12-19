import { AptosClient, Types } from "aptos";
import { withResponseError } from "../utils/api-client";
import { sortTransactions, isNumeric } from "../utils";

export async function getTransactions(
  requestParameters: { start?: number; limit?: number },
  client: AptosClient
): Promise<Types.Transaction[]> {
  const { start, limit } = requestParameters;
  let bigStart;
  if (start !== undefined) {
    bigStart = BigInt(start);
  }
  const transactions = await withResponseError(
    client.getTransactions({ start: bigStart, limit })
  );

  // Sort in descending order
  transactions.sort(sortTransactions);

  return transactions;
}

export async function getAccountTransactions(
  requestParameters: { address: string; start?: number; limit?: number },
  client: AptosClient
): Promise<Types.Transaction[]> {
  const { address, start, limit } = requestParameters;
  let bigStart;
  if (start !== undefined) {
    bigStart = BigInt(start);
  }
  const transactions = await withResponseError(
    client.getAccountTransactions(address, { start: bigStart, limit })
  );

  // Sort in descending order
  transactions.sort(sortTransactions);

  return transactions;
}

export function getTransaction(
  requestParameters: { txnHashOrVersion: string | number },
  client: AptosClient
): Promise<Types.Transaction> {
  const { txnHashOrVersion } = requestParameters;
  if (typeof txnHashOrVersion === "number" || isNumeric(txnHashOrVersion)) {
    const version =
      typeof txnHashOrVersion === "number"
        ? txnHashOrVersion
        : parseInt(txnHashOrVersion);
    return getTransactionByVersion(version, client);
  } else {
    return getTransactionByHash(txnHashOrVersion as string, client);
  }
}

function getTransactionByVersion(
  version: number,
  client: AptosClient
): Promise<Types.Transaction> {
  return withResponseError(client.getTransactionByVersion(BigInt(version)));
}

function getTransactionByHash(
  hash: string,
  client: AptosClient
): Promise<Types.Transaction> {
  return withResponseError(client.getTransactionByHash(hash));
}
