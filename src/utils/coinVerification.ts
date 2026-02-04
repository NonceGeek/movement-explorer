import {
  labsBannedAddresses,
  labsBannedTokenSymbols,
  labsBannedTokens,
  nativeTokens,
} from "@/constants";
import { getEmojicoinMarketAddressAndTypeTags } from "@/hooks/coins/emojicoin";
import { CoinDescription } from "@/hooks/coins/types";
import { Network } from "@aptos-labs/ts-sdk";

export enum VerifiedType {
  NATIVE_TOKEN = "Native",
  LABS_VERIFIED = "Verified",
  COMMUNITY_VERIFIED = "Community Verified",
  RECOGNIZED = "Recognized",
  UNVERIFIED = "Unverified",
  LABS_BANNED = "Banned",
  COMMUNITY_BANNED = "Community Banned",
  DISABLED = "No Verification",
}

export type VerifiedLevelInfo = {
  level: VerifiedType;
  reason?: string;
};

export function verifiedLevel(
  input: {
    id: string;
    known: boolean;
    isBanned?: boolean;
    isInPanoraTokenList?: boolean;
    symbol?: string;
    panoraTags?: CoinDescription["panoraTags"];
  },
  network: string,
): VerifiedLevelInfo {
  const isCoin = input.id.includes("::");

  let emojicoinInfo: { coin: string; lp: string } | null = null;
  if (isCoin && input.symbol) {
    emojicoinInfo = getEmojicoinMarketAddressAndTypeTags({
      symbol: input.symbol,
    });
  }

  if (nativeTokens[input.id] || input.panoraTags?.includes("Native")) {
    return { level: VerifiedType.NATIVE_TOKEN };
  }
  if (input.panoraTags?.includes("Verified")) {
    return { level: VerifiedType.LABS_VERIFIED };
  }
  if (labsBannedTokens[input.id] || input.panoraTags?.includes("Banned")) {
    return {
      level: VerifiedType.LABS_BANNED,
      reason: labsBannedTokens[input.id],
    };
  }
  if (input.isBanned) {
    return { level: VerifiedType.COMMUNITY_BANNED };
  }
  if (network !== Network.MAINNET) {
    return {
      level: VerifiedType.DISABLED,
      reason: "Verification only enabled for Mainnet",
    };
  }
  if (isCoin && emojicoinInfo?.lp === input.id) {
    return {
      level: VerifiedType.LABS_VERIFIED,
      reason: "Verified as an Emojicoin LP",
    };
  }
  if (isCoin && emojicoinInfo?.coin === input.id) {
    return {
      level: VerifiedType.LABS_VERIFIED,
      reason: "Verified as an Emojicoin",
    };
  }
  if (isCoin && labsBannedAddresses[input.id.split("::")[0]]) {
    return {
      level: VerifiedType.LABS_BANNED,
      reason: labsBannedAddresses[input.id.split("::")[0]],
    };
  }
  if (
    input.symbol &&
    labsBannedTokenSymbols[input.symbol.toUpperCase() ?? ""]
  ) {
    return {
      level: VerifiedType.LABS_BANNED,
      reason: labsBannedTokenSymbols[input.symbol.toUpperCase() ?? ""],
    };
  }
  if (input.isInPanoraTokenList) {
    return { level: VerifiedType.COMMUNITY_VERIFIED };
  }
  if (input.known) {
    return { level: VerifiedType.RECOGNIZED };
  }

  return { level: VerifiedType.UNVERIFIED };
}
