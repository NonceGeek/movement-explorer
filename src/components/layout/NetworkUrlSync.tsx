"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  defaultNetworkName,
  NetworkName,
  normalizeNetworkName,
} from "@/constants";

// URL param to network name mapping
const urlParamToNetwork: Record<string, NetworkName> = {
  mainnet: "mainnet",
  "bardock-testnet": "testnet",
  testnet: "testnet",
};

/**
 * Keeps the selected network shareable in the URL.
 * URL network params take precedence, and internal navigation keeps non-default networks.
 */
export default function NetworkUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { network_name, selectNetwork } = useGlobalStore();
  const lastAppliedUrlNetworkRef = useRef<string | null>(null);

  const urlNetwork = searchParams.get("network");
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    if (urlNetwork === lastAppliedUrlNetworkRef.current) return;
    lastAppliedUrlNetworkRef.current = urlNetwork;

    if (urlNetwork) {
      const mappedNetwork = urlParamToNetwork[urlNetwork];
      if (mappedNetwork) {
        const normalizedNetwork = normalizeNetworkName(mappedNetwork);
        if (normalizedNetwork !== network_name) {
          selectNetwork(normalizedNetwork);
        }
      }
    }
  }, [network_name, selectNetwork, urlNetwork]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsString);

    if (urlNetwork) {
      const mappedNetwork = urlParamToNetwork[urlNetwork];
      if (mappedNetwork) {
        const normalizedNetwork = normalizeNetworkName(mappedNetwork);

        if (urlNetwork === "bardock-testnet") {
          nextParams.set("network", "testnet");
          router.replace(`${pathname}?${nextParams.toString()}`, {
            scroll: false,
          });
          return;
        }

        if (
          network_name === defaultNetworkName ||
          normalizedNetwork === defaultNetworkName
        ) {
          nextParams.delete("network");
          const nextUrl = nextParams.toString()
            ? `${pathname}?${nextParams.toString()}`
            : pathname;
          router.replace(nextUrl, { scroll: false });
        }
        return;
      }
    }

    if (network_name !== defaultNetworkName) {
      nextParams.set("network", network_name);
      router.replace(`${pathname}?${nextParams.toString()}`, {
        scroll: false,
      });
    }
  }, [network_name, pathname, router, searchParamsString, urlNetwork]);

  return null;
}
