"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  nativeTokens,
  labsBannedTokens,
  labsBannedAddresses,
  labsBannedTokenSymbols,
} from "@/constants";
import { CoinDescription } from "@/hooks/coins/types";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  ShieldCheck,
  BadgeCheck,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Ban,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/utils/styling";

// Verification levels
export enum VerifiedType {
  NATIVE_TOKEN = "Native",
  LABS_VERIFIED = "Verified",
  COMMUNITY_VERIFIED = "Community Verified",
  RECOGNIZED = "Recognized",
  UNVERIFIED = "Unverified",
  LABS_BANNED = "Banned",
  COMMUNITY_BANNED = "Community Banned",
  DISABLED = "No Verification",
}

export function isBannedType(level: VerifiedType): boolean {
  return (
    level === VerifiedType.COMMUNITY_BANNED ||
    level === VerifiedType.LABS_BANNED
  );
}

export type VerifiedLevelInfo = {
  level: VerifiedType;
  reason?: string;
};

interface VerifiedAssetInput {
  id: string; // FA address or Coin Type
  known: boolean;
  isBanned?: boolean;
  isInPanoraTokenList?: boolean;
  symbol?: string;
  panoraTags?: string[];
}

export function verifiedLevel(
  input: VerifiedAssetInput,
  networkName: string
): VerifiedLevelInfo {
  const isCoin = input.id.includes("::");

  // Check for native token
  if (nativeTokens[input.id] || input.panoraTags?.includes("Native")) {
    return {
      level: VerifiedType.NATIVE_TOKEN,
    };
  }

  // Check for Labs verified
  if (input.panoraTags?.includes("Verified")) {
    return {
      level: VerifiedType.LABS_VERIFIED,
    };
  }

  // Check for Labs banned
  if (labsBannedTokens[input.id] || input.panoraTags?.includes("Banned")) {
    return {
      level: VerifiedType.LABS_BANNED,
      reason: labsBannedTokens[input.id],
    };
  }

  // Check for community banned
  if (input?.isBanned) {
    return {
      level: VerifiedType.COMMUNITY_BANNED,
    };
  }

  // For non-mainnet, disable verification
  if (networkName !== "mainnet") {
    return {
      level: VerifiedType.DISABLED,
      reason: "Verification only enabled for Mainnet",
    };
  }

  // Check for banned addresses (for coins)
  if (isCoin && labsBannedAddresses[input.id.split("::")[0]]) {
    return {
      level: VerifiedType.LABS_BANNED,
      reason: labsBannedAddresses[input.id.split("::")[0]],
    };
  }

  // Check for banned symbols
  if (
    input.symbol &&
    labsBannedTokenSymbols[input.symbol.toUpperCase() ?? ""]
  ) {
    return {
      level: VerifiedType.LABS_BANNED,
      reason: labsBannedTokenSymbols[input.symbol.toUpperCase() ?? ""],
    };
  }

  // Check for community verified (in Panora token list)
  if (input?.isInPanoraTokenList) {
    return {
      level: VerifiedType.COMMUNITY_VERIFIED,
    };
  }

  // Check for recognized (known but not verified)
  if (input?.known) {
    return {
      level: VerifiedType.RECOGNIZED,
    };
  }

  return {
    level: VerifiedType.UNVERIFIED,
  };
}

function getVerifiedConfig(level: VerifiedType, reason?: string) {
  switch (level) {
    case VerifiedType.NATIVE_TOKEN:
      return {
        icon: ShieldCheck,
        label: "Native",
        tooltip: "This asset is verified as a native token of Movement.",
        variant: "default" as const,
        className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      };
    case VerifiedType.LABS_VERIFIED:
      return {
        icon: BadgeCheck,
        label: "Verified",
        tooltip: `This asset is verified by the builders of the explorer.${reason ? ` Reason: ${reason}` : ""}`,
        variant: "default" as const,
        className: "bg-guild-green-500/10 text-guild-green-500 border-guild-green-500/20",
      };
    case VerifiedType.COMMUNITY_VERIFIED:
      return {
        icon: CheckCircle,
        label: "Community",
        tooltip: "This asset is on the Movement tokens list.",
        variant: "default" as const,
        className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      };
    case VerifiedType.RECOGNIZED:
      return {
        icon: AlertTriangle,
        label: "Recognized",
        tooltip:
          "This asset is recognized, but may not have been verified by the community.",
        variant: "secondary" as const,
        className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      };
    case VerifiedType.UNVERIFIED:
      return {
        icon: HelpCircle,
        label: "Unverified",
        tooltip:
          "This asset is not verified. It may or may not be recognized by the community. Please use with caution.",
        variant: "secondary" as const,
        className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      };
    case VerifiedType.COMMUNITY_BANNED:
      return {
        icon: AlertCircle,
        label: "Banned",
        tooltip:
          "This asset has been banned on the Panora token list. Please avoid using this asset.",
        variant: "destructive" as const,
        className: "bg-destructive/10 text-destructive border-destructive/20",
      };
    case VerifiedType.LABS_BANNED:
      return {
        icon: Ban,
        label: "Banned",
        tooltip: `This asset has been marked as a scam or dangerous. Please avoid using this asset.${reason ? ` Reason: ${reason}` : ""}`,
        variant: "destructive" as const,
        className: "bg-destructive/10 text-destructive border-destructive/20",
      };
    case VerifiedType.DISABLED:
      return {
        icon: HelpCircle,
        label: "N/A",
        tooltip: `Verification disabled for non-Mainnet.${reason ? ` ${reason}` : ""}`,
        variant: "secondary" as const,
        className: "bg-muted text-muted-foreground border-border",
      };
  }
}

interface VerifiedAssetBadgeProps {
  id: string; // Coin struct or FA address
  coinData?: CoinDescription;
  symbol?: string;
  showLabel?: boolean; // Show text label, default true
  size?: "sm" | "default";
  className?: string;
}

export function VerifiedAssetBadge({
  id,
  coinData,
  symbol,
  showLabel = true,
  size = "default",
  className,
}: VerifiedAssetBadgeProps) {
  const { network_name } = useGlobalStore();

  const input: VerifiedAssetInput = {
    id,
    known: !!coinData,
    isBanned: coinData?.isBanned,
    isInPanoraTokenList: coinData?.isInPanoraTokenList,
    symbol: symbol || coinData?.symbol,
    panoraTags: coinData?.panoraTags,
  };

  const { level, reason } = verifiedLevel(input, network_name);
  const config = getVerifiedConfig(level, reason);
  const Icon = config.icon;

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const badgeSize = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "font-medium gap-1.5 cursor-default border",
              config.className,
              badgeSize,
              className
            )}
          >
            <Icon className={iconSize} />
            {showLabel && <span>{config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
