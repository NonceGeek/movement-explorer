import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon } from "lucide-react";
import { isValidIpfsUrl, toIpfsUrl } from "@/store/utils";

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
          <Skeleton className="w-full h-full" />
        ) : tokenUri ? (
          <img
            src={parsedUrl}
            alt={tokenName || "Token"}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                const icon = document.createElement("div");
                icon.innerHTML =
                  '<svg class="w-8 h-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                parent.appendChild(icon.firstChild as Node);
              }
            }}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1">
        <h1 className="text-3xl font-bold">
          {isLoading ? (
            <Skeleton className="h-9 w-48" />
          ) : (
            tokenName || "Unknown Token"
          )}
        </h1>
        {collectionName && (
          <p className="text-muted-foreground mt-1">
            Collection: {collectionName}
          </p>
        )}
        <p className="text-muted-foreground font-mono text-xs mt-2 truncate max-w-lg">
          {tokenId}
        </p>
      </div>
    </div>
  );
}
