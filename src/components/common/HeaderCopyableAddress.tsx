"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/styling";
import { formatMovementPath } from "@/utils";

interface HeaderCopyableAddressProps {
  address: string;
  className?: string;
}

export function HeaderCopyableAddress({
  address,
  className,
}: HeaderCopyableAddressProps) {
  const [copied, setCopied] = useState(false);
  const displayAddress = formatMovementPath(address);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center gap-1.5 bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-md transition-colors group cursor-pointer",
              className,
            )}
          >
            <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground break-all text-start hidden sm:inline">
              {displayAddress}
            </span>
            <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground text-start sm:hidden">
              {displayAddress.length > 12
                ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
                : displayAddress}
            </span>
            <span className="relative h-4 w-4 shrink-0">
              <Copy
                className={cn(
                  "absolute inset-0 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all duration-200",
                  copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                )}
              />
              <Check
                className={cn(
                  "absolute inset-0 h-4 w-4 text-(--ms-good) transition-all duration-200",
                  copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                )}
              />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{copied ? "Copied!" : "Click to copy"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
