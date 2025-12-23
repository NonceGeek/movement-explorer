"use client";

import { ChevronDown, Check } from "lucide-react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { availableNetworks, NetworkName, networks } from "@/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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

export default function NetworkSelect() {
  const { network_name, selectNetwork } = useGlobalStore();

  const handleNetworkChange = (network: string) => {
    selectNetwork(network as NetworkName);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-normal capitalize"
        >
          {getDisplayNetworkName(network_name)}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {Object.entries(networks)
          .filter(([name]) => availableNetworks.includes(name))
          .map(([name]) => (
            <DropdownMenuItem
              key={name}
              onClick={() => handleNetworkChange(name)}
              className="capitalize justify-between"
            >
              {getDisplayNetworkName(name)}
              {name === network_name && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
