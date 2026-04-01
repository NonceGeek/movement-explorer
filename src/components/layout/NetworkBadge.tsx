"use client";

import { useState } from "react";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  availableNetworks,
  NetworkName,
  networks,
  defaultNetworkName,
} from "@/constants";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/styling";
import { networkToUrlParam } from "./NetworkSelect";

function getShortNetworkName(networkName: string): string {
  if (networkName === "mainnet") return "Mainnet";
  if (networkName === "bardock testnet") return "Bardock";
  if (networkName === "testnet") return "Porto";
  return networkName.charAt(0).toUpperCase() + networkName.slice(1);
}

function getDisplayNetworkName(networkName: string): string {
  if (networkName === "testnet") return "Porto Testnet";
  if (networkName === "bardock testnet") return "Bardock Testnet";
  if (networkName === "mainnet") return "Mainnet Beta";
  return networkName.charAt(0).toUpperCase() + networkName.slice(1);
}

function getNetworkDotColor(networkName: string): string {
  if (networkName === "mainnet") return "bg-guild-green-500";
  if (networkName === "bardock testnet") return "bg-amber-500";
  return "bg-blue-500";
}

export default function NetworkBadge() {
  const { network_name, selectNetwork } = useGlobalStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleNetworkChange = (network: string) => {
    const networkName = network as NetworkName;
    selectNetwork(networkName);
    setOpen(false);

    const newParams = new URLSearchParams(searchParams.toString());
    if (networkName === defaultNetworkName) {
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

  const availableNetworkList = Object.entries(networks).filter(([name]) =>
    availableNetworks.includes(name),
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5",
          "rounded-full border border-primary bg-background/40",
          "text-sm font-medium text-muted-foreground",
          "hover:bg-background/60 hover:text-foreground",
          "transition-all outline-none cursor-pointer",
        )}
      >
        <span>{getShortNetworkName(network_name)}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 opacity-50 transition-transform",
            open && "rotate-180",
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className={cn(
          "w-48 rounded-xl p-2 space-y-1",
          "bg-card/95 backdrop-blur-xl",
          "border border-border/60",
          "shadow-xl shadow-black/10",
        )}
      >
        {availableNetworkList.map(([name]) => (
          <DropdownMenuItem
            key={name}
            onClick={() => handleNetworkChange(name)}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-2 text-sm font-medium",
              "transition-all duration-200 ease-out",
              network_name === name
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:text-foreground hover:bg-muted/60",
            )}
          >
            {/* <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0 mr-2",
                getNetworkDotColor(name),
              )}
            /> */}
            {getDisplayNetworkName(name)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
