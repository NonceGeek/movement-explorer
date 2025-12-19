import { AptosClient, Types } from "aptos";
import { Aptos, Block } from "@aptos-labs/ts-sdk";
import { withResponseError } from "../utils/api-client";

// V1 style with AptosClient
export async function getRecentBlocks(
  currentBlockHeight: number,
  count: number,
  client: AptosClient
): Promise<Types.Block[]> {
  const blocks = [];
  for (let i = 0; i < count + 1; i++) {
    if (currentBlockHeight - i >= 0) {
      const block = await client.getBlockByHeight(
        currentBlockHeight - i,
        false
      );
      blocks.push(block);
    }
  }
  const blockPromises = [];
  // Don't await here, or they'll be in serial
  for (let i = 0; i < count; i++) {
    const block = client.getBlockByHeight(currentBlockHeight - i, false);
    blockPromises.push(block);
  }
  return Promise.all(blockPromises);
}

// V2 SDK style with Aptos (SDK v2)

export function getBlockByHeight(
  requestParameters: { height: number; withTransactions: boolean },
  aptos: Aptos
): Promise<Block> {
  const { height, withTransactions } = requestParameters;
  return withResponseError(
    aptos.getBlockByHeight({
      blockHeight: height,
      options: { withTransactions },
    })
  );
}

export function getBlockByVersion(
  requestParameters: { version: number; withTransactions: boolean },
  aptos: Aptos
): Promise<Block> {
  const { version, withTransactions } = requestParameters;
  return withResponseError(
    aptos.getBlockByVersion({
      ledgerVersion: version,
      options: { withTransactions },
    })
  );
}

export async function getRecentBlocksV2(
  currentBlockHeight: bigint | number,
  count: bigint | number,
  aptos: Aptos
): Promise<Block[]> {
  const blockPromises = [];
  // Don't await here, or they'll be in serial
  for (let i = BigInt(0); i < BigInt(count); i++) {
    const block = aptos.getBlockByHeight({
      blockHeight: BigInt(currentBlockHeight) - i,
      options: { withTransactions: false }, // Always false, or this will take forever
    });
    blockPromises.push(block);
  }
  return Promise.all(blockPromises);
}
