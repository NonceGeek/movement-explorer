import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { isValidIpfsUrl, toIpfsUrl } from "@/store/utils";
import { HeaderCopyableAddress } from "@/components/common/HeaderCopyableAddress";
import { AccountIcon } from "@/app/account/[address]/components/AccountIcon";

interface TokenHeaderProps {
  isLoading: boolean;
  tokenName?: string;
  tokenId: string;
  tokenUri?: string;
  collectionName?: string;
}

export function TokenHeader({
  isLoading,
  tokenName,
  tokenId,
  tokenUri,
  collectionName,
}: TokenHeaderProps) {
  let parsedUrl = tokenUri ?? "";
  if (isValidIpfsUrl(parsedUrl)) {
    parsedUrl = toIpfsUrl(parsedUrl);
  }

  return (
    <div className="flex items-start gap-6 mb-6">
      {/* Token Image */}
      <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {isLoading ? (
          <EnhancedSkeleton className="w-full h-full" />
        ) : tokenUri ? (
          <img
            src={parsedUrl}
            alt={tokenName || "Token"}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <AccountIcon type="token" address={tokenId} size="lg" />
        )}
      </div>

      <div className="flex-1">
        <h1 className="text-3xl font-bold">
          {isLoading ? (
            <EnhancedSkeleton className="h-9 w-48" />
          ) : (
            tokenName || "Unknown Token"
          )}
        </h1>
        {collectionName && (
          <p className="text-muted-foreground mt-1">
            Collection: {collectionName}
          </p>
        )}
        <div className="mt-2">
          <HeaderCopyableAddress address={tokenId} />
        </div>
      </div>
    </div>
  );
}
