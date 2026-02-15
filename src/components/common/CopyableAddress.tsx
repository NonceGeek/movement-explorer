"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, BadgeCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/styling";
import {
  useGetAccountLabel,
  AccountLabelType,
} from "@/hooks/accounts/useGetAccountLabel";
import { AccountLabelBadge } from "@/components/common/AccountLabelBadge";

export interface CopyableAddressProps {
  address: string;
  href?: string;
  className?: string;
  truncateLength?: { start: number; end: number };
  showCopyButton?: boolean;
  /** Show full address without truncation */
  showFull?: boolean;
  /** Styling variant */
  variant?: "default" | "muted" | "hash" | "label";
  /** Show account label (known name, ANS domain) instead of address if available */
  showLabel?: boolean;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Custom tooltip text for copy button */
  copyTooltip?: string;
}

export function CopyableAddress({
  address,
  href,
  className,
  truncateLength = { start: 6, end: 4 },
  showCopyButton = true,
  showFull = false,
  variant = "default",
  showLabel = false,
  icon,
  copyTooltip = "Copy address",
}: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);
  const accountLabel = useGetAccountLabel(address, showLabel);

  // Determine display text
  // If address is too short to truncate meaningfully, show it in full
  const minLengthForTruncation = truncateLength.start + truncateLength.end + 3; // +3 for "..."
  const shouldTruncate = address.length > minLengthForTruncation;

  const truncatedAddress = shouldTruncate
    ? `${address.slice(0, truncateLength.start)}...${truncateLength.end > 0 ? address.slice(-truncateLength.end) : ""}`
    : address;

  // Check if this is a verified address and we should show label
  const isVerifiedWithLabel =
    showLabel &&
    accountLabel?.name &&
    accountLabel.type === AccountLabelType.VERIFIED;

  // Use label name for verified addresses, otherwise use address
  const displayText = isVerifiedWithLabel
    ? accountLabel.name
    : showFull
      ? address
      : truncatedAddress;

  // When using label variant with showLabel and NOT verified, delegate to AccountLabelBadge
  // (for ANS, SCAM, etc. that need special styling)
  const useLabelBadge =
    showLabel &&
    accountLabel?.name &&
    variant === "label" &&
    accountLabel.type !== AccountLabelType.VERIFIED;

  const variantStyles = {
    default: href
      ? "text-guild-green-300 hover:text-guild-green-300/80 transition-colors"
      : "",
    muted: "text-muted-foreground",
    hash: "text-foreground bg-muted/50 px-2 py-1 rounded-md",
    label: "bg-muted px-3 py-1 rounded-sm hover:opacity-80 transition-opacity",
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

  // When useLabelBadge is true, render AccountLabelBadge with link wrapper
  if (useLabelBadge) {
    const LabelBadgeElement = (
      <AccountLabelBadge
        accountLabel={accountLabel}
        variant="compact"
        className={cn("hover:opacity-80 transition-opacity", className)}
      />
    );

    const WrappedLabelBadge = href ? (
      <Link href={href} onClick={(e) => e.stopPropagation()}>
        {LabelBadgeElement}
      </Link>
    ) : (
      LabelBadgeElement
    );

    return (
      <TooltipProvider>
        <div className="inline-flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>{WrappedLabelBadge}</TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-80 break-all font-mono text-xs"
            >
              <p>{address}</p>
            </TooltipContent>
          </Tooltip>

          {showCopyButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-200",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-muted/50 active:scale-90",
                  )}
                  aria-label="Copy address"
                >
                  <span className="relative block h-3.5 w-3.5">
                    <Copy
                      className={cn(
                        "absolute inset-0 h-3.5 w-3.5 transition-all duration-200",
                        copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                      )}
                    />
                    <Check
                      className={cn(
                        "absolute inset-0 h-3.5 w-3.5 text-guild-green-500 transition-all duration-200",
                        copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
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

  // Render content with optional verified icon
  const AddressContent = (
    <span
      className={cn(
        "font-mono text-sm break-all flex items-center gap-1.5",
        variantStyles[variant],
        className,
      )}
    >
      {icon}
      {displayText}
      {isVerifiedWithLabel && (
        <BadgeCheck className="h-5 w-5 text-byzantine-blue-300 shrink-0" fill="currentColor" stroke="white" strokeWidth={2} />
      )}
    </span>
  );

  const AddressElement = href ? (
    <Link
      href={href}
      className={cn(
        "font-mono text-sm break-all transition-colors flex items-center gap-1.5",
        variantStyles[variant],
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {icon}
      {displayText}
      {isVerifiedWithLabel && (
        <BadgeCheck className="h-5 w-5 text-byzantine-blue-300 shrink-0" fill="currentColor" stroke="white" strokeWidth={2} />
      )}
    </Link>
  ) : (
    AddressContent
  );

  return (
    <TooltipProvider>
      <div
        className={cn(
          "inline-flex items-center gap-1 transition-all duration-200 group/address",
          showFull && "flex-wrap",
          variant === "default" &&
          "hover:bg-primary/10 rounded-md pl-2 py-0.5",
          !showCopyButton && "pr-2"
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
                  "p-1.5 rounded-md transition-all duration-200 cursor-pointer",
                  "text-muted-foreground hover:text-guild-green-500",
                  "hover:bg-primary/20 active:scale-90",
                )}
                aria-label="Copy address"
              >
                <span className="relative block h-3.5 w-3.5">
                  <Copy
                    className={cn(
                      "absolute inset-0 h-3.5 w-3.5 transition-all duration-200",
                      copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                    )}
                  />
                  <Check
                    className={cn(
                      "absolute inset-0 h-3.5 w-3.5 text-guild-green-500 transition-all duration-200",
                      copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                    )}
                  />
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{copied ? "Copied!" : copyTooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
