"use client";

import { useState, useCallback } from "react";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  knownAddresses,
  faMetadataResource,
  objectCoreResource,
} from "@/constants";
import {
  isValidAccountAddress,
  isNumeric,
  is32ByteHex,
  truncateAddress,
  isValidStruct,
} from "@/utils";
import { useGetCoinList } from "@/hooks/coins/useGetCoinList";
import {
  CoinDescription,
  getEmojicoinMarketAddressAndTypeTags,
} from "@/hooks/coins";

export type SearchResult = {
  label: string;
  to: string | null;
  type:
    | "account"
    | "transaction"
    | "block"
    | "ans"
    | "label"
    | "coin"
    | "emojicoin"
    | "fungible_asset"
    | "object"
    | "coin_struct"
    | "none";
  image?: string;
};

export const NotFoundResult: SearchResult = {
  label: "No Results",
  to: null,
  type: "none",
};

type SearchMode = "idle" | "loading" | "results";

// Helper function for prefix matching
function prefixMatchLongerThan3(
  searchLowerCase: string,
  knownName: string | null | undefined
): boolean {
  if (!knownName) {
    return false;
  }
  const knownLower = knownName.toLowerCase();
  return (
    (searchLowerCase.length >= 3 &&
      (knownLower.startsWith(searchLowerCase) ||
        knownLower.includes(searchLowerCase))) ||
    (searchLowerCase.length < 3 && knownLower === searchLowerCase)
  );
}

// Helper to get asset symbol with bridge info
function getAssetSymbol(
  panoraSymbol: string | null,
  bridge: string | null,
  symbol: string
): string {
  if (panoraSymbol) {
    return panoraSymbol;
  }
  if (bridge) {
    return `${symbol} (${bridge})`;
  }
  return symbol;
}

// Coin order index for sorting
function coinOrderIndex(coin: CoinDescription): number {
  if (coin.native) return 0;
  if (coin.panoraTags?.includes("Verified")) return 1;
  if (coin.panoraTags?.includes("Recognized")) return 2;
  return coin.panoraIndex ?? 999;
}

export function useSearch() {
  const { sdk_v2_client, aptos_client } = useGlobalStore();
  const { data: coinListData } = useGetCoinList();
  const [mode, setMode] = useState<SearchMode>("idle");
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = useCallback(
    async (searchText: string) => {
      const trimmed = searchText.trim();
      if (!trimmed) {
        setResults([]);
        setMode("idle");
        return;
      }

      setMode("loading");
      const foundResults: SearchResult[] = [];

      try {
        // Check for ANS name (.apt or .petra suffix)
        let ansSearchText = trimmed;
        if (trimmed.endsWith(".petra")) {
          ansSearchText = trimmed.replace(".petra", ".apt");
        }
        const isAnsName = ansSearchText.endsWith(".apt");

        if (isAnsName) {
          try {
            const ansName = await sdk_v2_client.getName({
              name: ansSearchText,
            });
            const address =
              ansName?.registered_address ?? ansName?.owner_address;
            if (ansName && address) {
              foundResults.push({
                label: `Account ${truncateAddress(
                  address.toString()
                )} (${ansSearchText})`,
                to: `/account/${address}`,
                type: "ans",
              });
            }
          } catch {
            // ANS not found, continue
          }
        }

        // Check if numeric (block height or transaction version)
        if (isNumeric(trimmed)) {
          const num = parseInt(trimmed);

          // Try block by height
          try {
            await sdk_v2_client.getBlockByHeight({ blockHeight: num });
            foundResults.push({
              label: `Block ${num}`,
              to: `/block/${num}`,
              type: "block",
            });
          } catch {
            // Not a valid block height
          }

          // Try block by version (find block containing this transaction version)
          try {
            const block = await sdk_v2_client.getBlockByVersion({
              ledgerVersion: num,
            });
            if (block) {
              foundResults.push({
                label: `Block with Txn Version ${num}`,
                to: `/block/${block.block_height}`,
                type: "block",
              });
            }
          } catch {
            // Not a valid version for block lookup
          }

          // Try transaction by version
          try {
            await aptos_client.getTransactionByVersion(num);
            foundResults.push({
              label: `Transaction Version ${num}`,
              to: `/txn/${num}`,
              type: "transaction",
            });
          } catch {
            // Not a valid transaction version
          }
        }

        // Check if 32-byte hex (transaction hash)
        if (is32ByteHex(trimmed)) {
          try {
            await aptos_client.getTransactionByHash(trimmed);
            foundResults.push({
              label: `Transaction ${truncateAddress(trimmed)}`,
              to: `/txn/${trimmed}`,
              type: "transaction",
            });
          } catch {
            // Not a valid transaction hash
          }
        }

        // Check if valid account address
        if (isValidAccountAddress(trimmed)) {
          // Try as account
          try {
            await aptos_client.getAccount(trimmed);
            const knownName = knownAddresses[trimmed.toLowerCase()];
            foundResults.push({
              label: knownName
                ? `Account ${truncateAddress(trimmed)} (${knownName})`
                : `Account ${truncateAddress(trimmed)}`,
              to: `/account/${trimmed}`,
              type: "account",
            });
          } catch {
            // Account not found
          }

          // Try as Fungible Asset
          try {
            await aptos_client.getAccountResource(trimmed, faMetadataResource);
            foundResults.push({
              label: `Fungible Asset ${truncateAddress(trimmed)}`,
              to: `/fa/${trimmed}`,
              type: "fungible_asset",
            });
          } catch {
            // Not a Fungible Asset
          }

          // Try as Object
          try {
            await aptos_client.getAccountResource(trimmed, objectCoreResource);
            foundResults.push({
              label: `Object ${truncateAddress(trimmed)}`,
              to: `/object/${trimmed}`,
              type: "object",
            });
          } catch {
            // Not an Object
          }
        }

        // Check if valid struct (e.g., 0x1::coin::CoinInfo<...>)
        if (isValidStruct(trimmed)) {
          const address = trimmed.split("::")[0];
          try {
            await aptos_client.getAccountResource(
              address,
              `0x1::coin::CoinInfo<${trimmed}>`
            );
            foundResults.push({
              label: `Coin ${trimmed}`,
              to: `/coin/${trimmed}`,
              type: "coin_struct",
            });
          } catch {
            // Not a valid coin struct
          }
        }

        // Check for emoji (emojicoin search)
        if (trimmed.match(/^\p{Emoji}+$/u)) {
          const emojicoinData = getEmojicoinMarketAddressAndTypeTags({
            symbol: trimmed,
          });
          if (emojicoinData) {
            try {
              await aptos_client.getAccount(
                emojicoinData.marketAddress.toString()
              );
              foundResults.push({
                label: `${trimmed} Emojicoin`,
                to: `/coin/${emojicoinData.coin}`,
                type: "emojicoin",
              });
              foundResults.push({
                label: `${trimmed} Emojicoin LP`,
                to: `/coin/${emojicoinData.lp}`,
                type: "emojicoin",
              });
            } catch {
              // Emojicoin not found
            }
          }
        }

        // Search coin list (if 3+ characters or token address match)
        if (coinListData?.data && trimmed.length >= 3) {
          const searchLower = trimmed.toLowerCase();
          const matchedCoins = coinListData.data
            .filter(
              (coin: CoinDescription) =>
                !coin.isBanned &&
                !coin.panoraTags?.includes("InternalFA") &&
                coin.panoraTags &&
                coin.panoraTags.length > 0 &&
                (prefixMatchLongerThan3(searchLower, coin.name) ||
                  prefixMatchLongerThan3(searchLower, coin.symbol) ||
                  prefixMatchLongerThan3(searchLower, coin.panoraSymbol) ||
                  coin.tokenAddress === trimmed)
            )
            .sort(
              (a: CoinDescription, b: CoinDescription) =>
                coinOrderIndex(a) - coinOrderIndex(b)
            )
            .slice(0, 5); // Limit to 5 coin results

          matchedCoins.forEach((coin: CoinDescription) => {
            const label = `${coin.name} - ${getAssetSymbol(
              coin.panoraSymbol,
              coin.bridge,
              coin.symbol
            )}`;
            if (coin.tokenAddress) {
              foundResults.push({
                label,
                to: `/coin/${coin.tokenAddress}`,
                type: "coin",
                image: coin.logoUrl,
              });
            } else if (coin.faAddress) {
              foundResults.push({
                label,
                to: `/fungible_asset/${coin.faAddress}`,
                type: "coin",
                image: coin.logoUrl,
              });
            }
          });
        }

        // Search known address labels (if 3+ characters)
        if (
          trimmed.length >= 3 &&
          !isNumeric(trimmed) &&
          !is32ByteHex(trimmed)
        ) {
          const searchLower = trimmed.toLowerCase();
          Object.entries(knownAddresses).forEach(([address, name]) => {
            if (
              name.toLowerCase().includes(searchLower) &&
              address.toLowerCase() !==
                "0x000000000000000000000000000000000000000000000000000000000000000a"
            ) {
              // Avoid duplicates
              const exists = foundResults.some(
                (r) => r.to === `/account/${address}`
              );
              if (!exists) {
                foundResults.push({
                  label: `Account ${truncateAddress(address)} (${name})`,
                  to: `/account/${address}`,
                  type: "label",
                });
              }
            }
          });
        }

        // Set results or "No Results"
        if (foundResults.length === 0) {
          setResults([NotFoundResult]);
        } else {
          setResults(foundResults);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([NotFoundResult]);
      }

      setMode("results");
    },
    [sdk_v2_client, aptos_client, coinListData]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setMode("idle");
  }, []);

  return {
    mode,
    results,
    search,
    clearResults,
    isLoading: mode === "loading",
  };
}
