"use client";

import { useState } from "react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { availableNetworks, NetworkName, networks } from "@/constants";
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

export default function NetworkSelect() {
  const { network_name, selectNetwork } = useGlobalStore();

  const handleNetworkChange = (network: string) => {
    selectNetwork(network as NetworkName);
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
