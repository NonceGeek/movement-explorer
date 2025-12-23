import {
  AccountAddress,
  AccountAddressInput,
  DeriveScheme,
  Hex,
  HexInput,
} from "@aptos-labs/ts-sdk";
import { sha3_256 } from "js-sha3";
import { EMOJICOIN_REGISTRY_ADDRESS } from "./types";

const TEXT_ENCODER = new TextEncoder();

/**
 * Get emojicoin market address and type tags from an emoji symbol
 */
export function getEmojicoinMarketAddressAndTypeTags(args: { symbol: string }) {
  if (!args.symbol.match(/^\p{Emoji}+$/u)) {
    return null;
  }
  const symbolBytes = TEXT_ENCODER.encode(args.symbol);
  const marketAddress = deriveEmojicoinPublisherAddress({
    symbol: symbolBytes,
  });

  return {
    marketAddress,
    coin: `${marketAddress.toString()}::coin_factory::Emojicoin`,
    lp: `${marketAddress.toString()}::coin_factory::EmojicoinLP`,
  };
}

/**
 * Derive emojicoin publisher address from symbol bytes
 */
export function deriveEmojicoinPublisherAddress(args: {
  symbol: Uint8Array;
}): AccountAddress {
  return createNamedObjectAddress({
    creator: EMOJICOIN_REGISTRY_ADDRESS,
    seed: args.symbol,
  });
}

/**
 * Create a named object address from creator and seed
 */
export function createNamedObjectAddress(args: {
  creator: AccountAddressInput;
  seed: HexInput;
}): AccountAddress {
  const creatorAddress = AccountAddress.from(args.creator);
  const seed = Hex.fromHexInput(args.seed).toUint8Array();
  const serializedCreatorAddress = creatorAddress.bcsToBytes();
  const preImage = new Uint8Array([
    ...serializedCreatorAddress,
    ...seed,
    DeriveScheme.DeriveObjectAddressFromSeed,
  ]);

  return AccountAddress.from(sha3_256(preImage));
}
