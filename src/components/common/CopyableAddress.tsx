"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface CopyableAddressProps {
  address: string;
  href?: string;
  className?: string;
  truncateLength?: { start: number; end: number };
  showCopyButton?: boolean;
  /** Show full address without truncation */
  showFull?: boolean;
  /** Styling variant */
  variant?: "default" | "muted" | "hash";
}

export function CopyableAddress({
  address,
  href,
  className,
  truncateLength = { start: 8, end: 6 },
  showCopyButton = true,
  showFull = false,
  variant = "default",
}: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);

  const displayAddress = showFull
    ? address
    : `${address.slice(0, truncateLength.start)}...${address.slice(
        -truncateLength.end
      )}`;

  const variantStyles = {
    default: href ? "text-primary hover:underline" : "",
    muted: "text-muted-foreground",
    hash: "text-foreground bg-muted/50 px-2 py-1 rounded-md",
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const AddressContent = (
    <span
      className={cn(
        "font-mono text-sm break-all",
        variantStyles[variant],
        className
      )}
    >
      {displayAddress}
    </span>
  );

  const AddressElement = href ? (
    <Link
      href={href}
      className={cn(
        "font-mono text-sm break-all group-hover:text-white transition-colors",
        variantStyles[variant],
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {displayAddress}
    </Link>
  ) : (
    AddressContent
  );

  return (
    <TooltipProvider>
      <div
        className={cn(
          "inline-flex items-center gap-1",
          showFull && "flex-wrap"
        )}
      >
        {showFull ? (
          AddressElement
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>{AddressElement}</TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-80 break-all font-mono text-xs"
            >
              <p>{address}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showCopyButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                className={cn(
                  "p-1.5 rounded-md transition-all duration-200",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-muted/50 active:scale-90",
                  "group-hover:text-white/70 group-hover:hover:text-white group-hover:hover:bg-white/10"
                  // "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background"
                )}
                aria-label="Copy address"
              >
                <span className="relative block h-3.5 w-3.5">
                  <Copy
                    className={cn(
                      "absolute inset-0 h-3.5 w-3.5 transition-all duration-200",
                      copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                    )}
                  />
                  <Check
                    className={cn(
                      "absolute inset-0 h-3.5 w-3.5 text-guild-green-500 transition-all duration-200",
                      copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    )}
                  />
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{copied ? "Copied!" : "Copy address"}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
