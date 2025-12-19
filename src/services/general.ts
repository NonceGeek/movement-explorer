import { AptosClient, Types } from "aptos";
import { withResponseError } from "../utils/api-client";
import { isNumeric } from "../utils";

export function getLedgerInfo(
  client: AptosClient
): Promise<Types.IndexResponse> {
  return withResponseError(client.getLedgerInfo());
}

export function getLedgerInfoWithoutResponseError(
  nodeUrl: string
): Promise<Types.IndexResponse> {
  // This is a special case where we don't use the pre-existing client. This means we
  // do not attach an API key to the request, but it's okay for just this request to be
  // sent anonymously.
  const client = new AptosClient(nodeUrl);
  return client.getLedgerInfo();
}

export function view(
  request: Types.ViewRequest,
  client: AptosClient,
  ledgerVersion?: string
): Promise<Types.MoveValue[]> {
  let parsedVersion = ledgerVersion;

  // Handle non-numbers, to default to the latest ledger version
  if (typeof ledgerVersion === "string" && isNaN(parseInt(ledgerVersion, 10))) {
    parsedVersion = undefined;
  }

  return client.view(request, parsedVersion);
}

export function getTableItem(
  requestParameters: { tableHandle: string; data: Types.TableItemRequest },
  client: AptosClient
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const { tableHandle, data } = requestParameters;
  return withResponseError(client.getTableItem(tableHandle, data));
}
