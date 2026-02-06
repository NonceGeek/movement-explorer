"use client";

import { useQuery } from "@tanstack/react-query";
import { knownAddresses, scamAddresses, NetworkName } from "@/constants";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  standardizeAddress,
  getLocalStorageWithExpiry,
  setLocalStorageWithExpiry,
  fetchJsonResponse,
} from "@/utils";

const TTL = 60000; // 1 minute cache

export enum AccountLabelType {
  VERIFIED = "verified", // Known verified address (exchanges, protocols)
  SCAM = "scam", // Known scam address
  ANS = "ans", // Has ANS (.move) domain
  NONE = "none", // No label
}

export interface AccountLabel {
  name: string | null;
  type: AccountLabelType;
}

function getMNSFetchUrl(
  networkName: NetworkName,
  address: string,
  isPrimary: boolean,
): string | undefined {
  // MNS API only available on mainnet
  if (networkName !== "mainnet") {
    return undefined;
  }

  return isPrimary
    ? `https://move.movementlabs.xyz/api/${networkName}/primary-name/${address}`
    : `https://move.movementlabs.xyz/${networkName}/name/${address}`;
}

async function fetchMNSName(
  address: string,
  networkName: NetworkName,
): Promise<string | null> {
  const primaryNameUrl = getMNSFetchUrl(networkName, address, true);

  if (!primaryNameUrl) {
    return null;
  }

  try {
    const { name: primaryName } = await fetchJsonResponse(primaryNameUrl);

    if (primaryName) {
      return primaryName;
    }

    // If no primary name, try to get any name
    const nameUrl = getMNSFetchUrl(networkName, address, false);
    if (!nameUrl) {
      return null;
    }

    const { name } = await fetchJsonResponse(nameUrl);
    return name ?? null;
  } catch (error) {
    // Silently handle MNS API errors - service may be temporarily unavailable
    // This is a known issue: MNS API endpoint is unstable and often fails with ERR_CONNECTION_CLOSED
    // See: movement-exploreer-document/known-issues/known-issues.md
    return null;
  }
}

/**
 * Hook to get account label (known name, scam warning, or ANS domain)
 * @param address - The account address
 * @param shouldCache - Whether to cache the result in localStorage
 * @returns AccountLabel with name and type
 */
export function useGetAccountLabel(
  address: string,
  shouldCache: boolean = true,
): AccountLabel | undefined {
  const networkName = useGlobalStore((state) => state.network_name);

  const { data } = useQuery<AccountLabel | null>({
    queryKey: ["accountLabel", address, networkName],
    retry: 1, // Only retry once for MNS API failures
    queryFn: async (): Promise<AccountLabel | null> => {
      try {
        const standardizedAddress = standardizeAddress(address);
        const lowercaseAddress = standardizedAddress.toLowerCase();

        // Check known verified addresses first
        const knownName = knownAddresses[lowercaseAddress];
        if (knownName) {
          return {
            name: knownName,
            type: AccountLabelType.VERIFIED,
          };
        }

        // Check scam addresses
        const scamName = scamAddresses[lowercaseAddress];
        if (scamName) {
          return {
            name: scamName,
            type: AccountLabelType.SCAM,
          };
        }

        // Check localStorage cache for ANS name
        if (shouldCache) {
          const cachedName = getLocalStorageWithExpiry(`${address}:name`);
          if (cachedName) {
            return {
              name: `${cachedName}.move`,
              type: AccountLabelType.ANS,
            };
          }
        }

        // Fetch ANS name from API
        const mnsName = await fetchMNSName(address, networkName);
        if (mnsName) {
          if (shouldCache) {
            setLocalStorageWithExpiry(`${address}:name`, mnsName, TTL);
          }
          return {
            name: `${mnsName}.move`,
            type: AccountLabelType.ANS,
          };
        }

        return null;
      } catch (error) {
        console.error("Error fetching account label:", error);
        return null;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!address,
  });

  if (!data) {
    return undefined;
  }

  return data;
}

/**
 * Synchronous function to get known address label (no API call)
 * Use this when you only need to check against known addresses
 */
export function getKnownAddressLabel(address: string): AccountLabel | null {
  try {
    const standardizedAddress = standardizeAddress(address);
    const lowercaseAddress = standardizedAddress.toLowerCase();

    const knownName = knownAddresses[lowercaseAddress];
    if (knownName) {
      return {
        name: knownName,
        type: AccountLabelType.VERIFIED,
      };
    }

    const scamName = scamAddresses[lowercaseAddress];
    if (scamName) {
      return {
        name: scamName,
        type: AccountLabelType.SCAM,
      };
    }

    return null;
  } catch {
    return null;
  }
}
