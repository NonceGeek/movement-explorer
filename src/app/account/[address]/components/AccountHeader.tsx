"use client";

import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Clock } from "lucide-react";
import { AccountIcon, type AccountType } from "./AccountIcon";
import { HeaderCopyableAddress } from "@/components/common/HeaderCopyableAddress";
import { useGetAccountLabel } from "@/hooks/accounts/useGetAccountLabel";
import { cn } from "@/utils/styling";
import { formatAge } from "@/utils/time";

export interface AccountHeaderProps {
  address: string;
  accountType: AccountType;
  isObject?: boolean;
  isToken?: boolean;
  isDeleted?: boolean;
  isVerified?: boolean;
  hasContract?: boolean;
  createdAt?: number;
  className?: string;
}

export function AccountHeader({
  address,
  accountType,
  isObject = false,
  isToken = false,
  isDeleted = false,
  isVerified = false,
  hasContract = false,
  createdAt,
  className,
}: AccountHeaderProps) {
  const accountLabel = useGetAccountLabel(address);

  // Determine title
  let title = "Account";
  if (isToken) {
    title = isDeleted ? "Deleted Token Object" : "Token Object";
  } else if (isObject) {
    title = isDeleted ? "Deleted Object" : "Object";
  } else if (isDeleted) {
    title = "Deleted Account";
  }

  return (
    <div className={cn("flex items-start gap-3 sm:items-center sm:gap-4", className)}>
      <div className="shrink-0 hidden sm:block">
        <AccountIcon type={accountType} address={address} size="lg" />
      </div>
      <div className="shrink-0 sm:hidden">
        <AccountIcon type={accountType} address={address} size="md" />
      </div>
      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-heading font-semibold">{title}</h1>
          {isDeleted && (
            <Badge variant="destructive" className="text-xs">
              Deleted
            </Badge>
          )}
          {hasContract && (
            <Badge variant="default" className="text-xs">
              Contract
            </Badge>
          )}
          {isVerified && (
            <Badge
              variant="default"
              className="gap-1 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
            >
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
        {/* Address row */}
        <div className="flex items-center gap-2 flex-wrap">
          <HeaderCopyableAddress address={address} />
          {accountLabel?.name && (
            <Badge variant="secondary" className="text-xs">
              {accountLabel.name}
            </Badge>
          )}
          {createdAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {formatAge(createdAt.toString())}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
