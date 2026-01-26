"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { useGetTokenOwners } from "@/hooks/tokens/useGetTokenData";
import { CopyableAddress } from "@/components/common/CopyableAddress";

export function OwnersRow({ tokenId }: { tokenId: string }) {
  const { data: owners, isLoading } = useGetTokenOwners(tokenId);

  if (isLoading) {
    return (
      <div className="flex justify-between items-start py-3 border-b border-border/50">
        <span className="text-muted-foreground shrink-0">Owner(s):</span>
        <EnhancedSkeleton className="h-7 w-32" />
      </div>
    );
  }

  return (
    <div className="flex justify-between items-start py-3 border-b border-border/50">
      <span className="text-muted-foreground shrink-0">Owner(s):</span>
      <div className="text-right ml-4">
        {owners && owners.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-end">
            {owners.map((owner) => (
              <CopyableAddress
                key={owner.owner_address}
                address={owner.owner_address}
                href={`/account/${owner.owner_address}`}
                variant="label"
                showLabel
                truncateLength={{ start: 6, end: 4 }}
              />
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </div>
    </div>
  );
}
