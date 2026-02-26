"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { useGetTokenOwners } from "@/hooks/tokens/useGetTokenData";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { DetailRow } from "@/app/txn/[hash]/components/DetailRow";

export function OwnersRow({ tokenId }: { tokenId: string }) {
  const { data: owners, isLoading } = useGetTokenOwners(tokenId);

  if (isLoading) {
    return (
      <DetailRow label="Owner(s)">
        <EnhancedSkeleton className="h-5 w-32" />
      </DetailRow>
    );
  }

  return (
    <DetailRow label="Owner(s)">
      {owners && owners.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {owners.map((owner) => (
            <CopyableAddress
              key={owner.owner_address}
              address={owner.owner_address}
              href={`/account/${owner.owner_address}`}
              showFull
              showLabel
            />
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground">N/A</span>
      )}
    </DetailRow>
  );
}
