"use client";

import { CopyableAddress } from "@/components/common/CopyableAddress";
import { AccountLabelBadge } from "@/components/common/AccountLabelBadge";
import { Badge } from "@/components/ui/badge";
import { useGetAccountLabel } from "@/hooks/accounts/useGetAccountLabel";

interface AccountTitleProps {
  address: string;
  isAccount?: boolean;
  isObject?: boolean;
  isToken?: boolean;
  isDeleted?: boolean;
}

export default function AccountTitle({
  address,
  isAccount = false,
  isObject = false,
  isToken = false,
  isDeleted = false,
}: AccountTitleProps) {
  const accountLabel = useGetAccountLabel(address);

  // Priority: Token > Object (only if not Account) > Account
  let title = "Account";
  if (isToken) {
    title = isDeleted ? "Deleted Token Object" : "Token Object";
  } else if (isObject && !isAccount) {
    // Only show "Object" if it's purely an Object (not also an Account)
    title = isDeleted ? "Deleted Object" : "Object";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {isDeleted && <Badge variant="destructive">Deleted</Badge>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyableAddress
          address={address}
          showFull
          showCopyButton
          className="text-lg"
        />
        <AccountLabelBadge accountLabel={accountLabel ?? null} />
      </div>
    </div>
  );
}
