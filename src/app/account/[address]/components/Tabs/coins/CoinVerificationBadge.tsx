import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VerifiedLevelInfo, VerifiedType } from "@/utils/coinVerification";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CircleSlash,
  ShieldCheck,
} from "lucide-react";

function getVerificationDisplay(level: VerifiedType, reason?: string) {
  switch (level) {
    case VerifiedType.NATIVE_TOKEN:
      return {
        label: "Native",
        icon: <ShieldCheck className="h-4 w-4 text-blue-500" />,
        tooltip: "This asset is verified as a native token of Movement.",
      };
    case VerifiedType.LABS_VERIFIED:
      return {
        label: "Verified",
        icon: <BadgeCheck className="h-4 w-4 text-blue-500" />,
        tooltip:
          "This asset is verified by the builders of the explorer." +
          (reason ? ` Reason: (${reason})` : ""),
      };
    case VerifiedType.COMMUNITY_VERIFIED:
      return {
        label: "Community",
        icon: <BadgeCheck className="h-4 w-4 text-blue-400" />,
        tooltip: "This asset is on the Movement tokens list",
      };
    case VerifiedType.RECOGNIZED:
      return {
        label: "Recognized",
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        tooltip:
          "This asset is recognized, but many not have been verified by the community.",
      };
    case VerifiedType.UNVERIFIED:
      return {
        label: "Unverified",
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
        tooltip:
          "This asset is not verified, it may or may not be recognized by the community.  Please use with caution.",
      };
    case VerifiedType.COMMUNITY_BANNED:
      return {
        label: "Banned",
        icon: <Ban className="h-4 w-4 text-red-500" />,
        tooltip:
          "This asset has been banned on the Panora token list, please avoid using this asset.",
      };
    case VerifiedType.LABS_BANNED:
      return {
        label: "Banned",
        icon: <Ban className="h-4 w-4 text-red-500" />,
        tooltip:
          "This asset has been marked as a scam or dangerous, please avoid using this asset." +
          (reason ? ` Reason: (${reason})` : ""),
      };
    case VerifiedType.DISABLED:
      return {
        label: "Disabled",
        icon: <CircleSlash className="h-4 w-4 text-muted-foreground" />,
        tooltip:
          "Verification disabled for non-Mainnet" +
          (reason ? ` Reason: (${reason})` : ""),
      };
    default:
      return {
        label: "Unverified",
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
        tooltip: "This asset is not verified. Please use with caution.",
      };
  }
}

export function CoinVerificationBadge({
  verification,
}: {
  verification: VerifiedLevelInfo;
}) {
  const display = getVerificationDisplay(
    verification.level,
    verification.reason,
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={
              verification.level === VerifiedType.LABS_BANNED ||
              verification.level === VerifiedType.COMMUNITY_BANNED
                ? "destructive"
                : "secondary"
            }
            className="inline-flex items-center gap-1"
          >
            {display.icon}
            <span className="text-xs">{display.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{display.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
