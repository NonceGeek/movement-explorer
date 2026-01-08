"use client";

import { useGlobalStore } from "@/store/useGlobalStore";
import {
  availableNetworks,
  NetworkName,
  networks,
  defaultNetworkName,
} from "@/constants";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Get display-friendly network name
 */
function getDisplayNetworkName(networkName: string): string {
  if (networkName === "testnet") {
    return "Porto Testnet";
  } else if (networkName === "bardock testnet") {
    return "Bardock Testnet";
  } else if (networkName === "mainnet") {
    return "Mainnet";
  }
  return networkName.charAt(0).toUpperCase() + networkName.slice(1);
}

// Network name to URL param mapping
const networkToUrlParam: Record<string, string> = {
  mainnet: "mainnet",
  "bardock testnet": "bardock-testnet",
};

// URL param to network name mapping
const urlParamToNetwork: Record<string, NetworkName> = {
  mainnet: "mainnet",
  "bardock-testnet": "bardock testnet",
  testnet: "bardock testnet", // alias
};

export default function NetworkSelect() {
  const { network_name, selectNetwork } = useGlobalStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleNetworkChange = (network: string) => {
    const networkName = network as NetworkName;
    selectNetwork(networkName);

    // Update URL with network param
    const newParams = new URLSearchParams(searchParams.toString());

    if (networkName === defaultNetworkName) {
      // Remove network param for default (mainnet)
      newParams.delete("network");
    } else {
      const urlValue = networkToUrlParam[networkName];
      if (urlValue) {
        newParams.set("network", urlValue);
      }
    }

    const newUrl = newParams.toString()
      ? `${pathname}?${newParams.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
  };

  return (
    <Select value={network_name} onValueChange={handleNetworkChange}>
      <SelectTrigger
        variant="outline"
        size="sm"
        className="w-[180px] gap-1.5 font-normal capitalize rounded-full text-base"
      >
        <SelectValue placeholder="Select Network">
          {getDisplayNetworkName(network_name)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="text-base">
        {Object.entries(networks)
          .filter(([name]) => availableNetworks.includes(name))
          .map(([name]) => (
            <SelectItem key={name} value={name}>
              {getDisplayNetworkName(name)}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

// Export URL param mappings for use in other components
export { networkToUrlParam, urlParamToNetwork };
