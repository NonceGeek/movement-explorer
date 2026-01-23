"use client";

import { useState, useRef, useCallback } from "react";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  availableNetworks,
  NetworkName,
  networks,
  defaultNetworkName,
} from "@/constants";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  }, []);

  const handleNetworkChange = (network: string) => {
    const networkName = network as NetworkName;
    selectNetwork(networkName);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setOpen(false);

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

  const availableNetworkList = Object.entries(networks).filter(([name]) =>
    availableNetworks.includes(name)
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        className={cn(
          "flex items-center justify-between gap-1.5",
          "w-[180px] h-10 px-3 py-2",
          "rounded-full border-2 border-primary bg-background",
          "text-base font-normal capitalize",
          "hover:bg-primary hover:text-primary-foreground",
          "transition-all outline-none"
        )}
      >
        {getDisplayNetworkName(network_name)}
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-[180px]"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        {availableNetworkList.map(([name]) => (
          <DropdownMenuItem
            key={name}
            onClick={() => handleNetworkChange(name)}
            className={cn(
              "cursor-pointer justify-between",
              network_name === name && "bg-primary text-primary-foreground"
            )}
          >
            {getDisplayNetworkName(name)}
            {network_name === name && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export URL param mappings for use in other components
export { networkToUrlParam, urlParamToNetwork };
