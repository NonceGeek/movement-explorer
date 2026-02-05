"use client";

import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Clock } from "lucide-react";
import { AccountIcon, type AccountType } from "./AccountIcon";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { useGetAccountLabel } from "@/hooks/accounts/useGetAccountLabel";
import { cn } from "@/utils/styling";
import { formatAge } from "@/utils/time";

export interface AccountHeaderProps {
  address: string;
  accountType: AccountType;
  isAccount?: boolean;
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
  isAccount = false,
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
  } else if (isObject && !isAccount) {
    title = isDeleted ? "Deleted Object" : "Object";
  } else if (isDeleted) {
    title = "Deleted Account";
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <AccountIcon type={accountType} address={address} size="lg" />
      <div className="min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-heading font-bold">{title}</h1>
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
          <CopyableAddress
            address={address}
            showFull
            showCopyButton
            variant="muted"
            className="text-sm"
          />
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
