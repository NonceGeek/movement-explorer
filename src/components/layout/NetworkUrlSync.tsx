"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useGlobalStore } from "@/store/useGlobalStore";
import { NetworkName } from "@/constants";

// URL param to network name mapping
const urlParamToNetwork: Record<string, NetworkName> = {
  mainnet: "mainnet",
  "bardock-testnet": "bardock testnet",
  testnet: "bardock testnet", // alias
};

/**
 * Component that syncs URL network param to the global store on initial mount only.
 * This runs once on page load to apply the network from URL.
 * After initial sync, changes are handled by NetworkSelect.
 */
export default function NetworkUrlSync() {
  const searchParams = useSearchParams();
  const { selectNetwork } = useGlobalStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only sync on initial mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const urlNetwork = searchParams.get("network");
    if (urlNetwork) {
      const mappedNetwork = urlParamToNetwork[urlNetwork];
      if (mappedNetwork) {
        selectNetwork(mappedNetwork);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
