import { AptosClient, Types } from "aptos";
import { withResponseError } from "../utils/api-client";
import {
  AccountAddressInput,
  APTOS_COIN,
  Aptos,
  InputViewFunctionData,
  TypeTagAddress,
  TypeTagU64,
} from "@aptos-labs/ts-sdk";

export function getAccount(
  requestParameters: { address: string },
  client: AptosClient
): Promise<Types.AccountData> {
  const { address } = requestParameters;
  return withResponseError(client.getAccount(address));
}

export function getAccountResources(
  requestParameters: { address: string; ledgerVersion?: number },
  client: AptosClient
): Promise<Types.MoveResource[]> {
  const { address, ledgerVersion } = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountResources(address, { ledgerVersion: ledgerVersionBig })
  );
}

export function getAccountResource(
  requestParameters: {
    address: string;
    resourceType: string;
    ledgerVersion?: number;
  },
  client: AptosClient
): Promise<Types.MoveResource> {
  const { address, resourceType, ledgerVersion } = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountResource(address, resourceType, {
      ledgerVersion: ledgerVersionBig,
    })
  );
}

export function getAccountModules(
  requestParameters: { address: string; ledgerVersion?: number },
  client: AptosClient
): Promise<Types.MoveModuleBytecode[]> {
  const { address, ledgerVersion } = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountModules(address, { ledgerVersion: ledgerVersionBig })
  );
}

export function getAccountModule(
  requestParameters: {
    address: string;
    moduleName: string;
    ledgerVersion?: number;
  },
  client: AptosClient
): Promise<Types.MoveModuleBytecode> {
  const { address, moduleName, ledgerVersion } = requestParameters;
  let ledgerVersionBig;
  if (ledgerVersion !== undefined) {
    ledgerVersionBig = BigInt(ledgerVersion);
  }
  return withResponseError(
    client.getAccountModule(address, moduleName, {
      ledgerVersion: ledgerVersionBig,
    })
  );
}

export async function getBalance(
  client: Aptos,
  address: AccountAddressInput,
  coinType?: `0x${string}::${string}::${string}`
): Promise<string> {
  const typeArguments = coinType ? [coinType] : [APTOS_COIN];

  // TODO: Replace with native SDK call
  const payload: InputViewFunctionData = {
    function: "0x1::coin::balance",
    typeArguments,
    functionArguments: [address],
    abi: {
      parameters: [new TypeTagAddress()],
      typeParameters: [{ constraints: [] }],
      returnTypes: [new TypeTagU64()],
    },
  };
  return withResponseError(
    client.view<[string]>({ payload }).then((res: [string]) => res[0])
  );
}
