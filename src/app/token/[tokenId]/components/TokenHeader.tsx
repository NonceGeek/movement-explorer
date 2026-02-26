"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { HeaderCopyableAddress } from "@/components/common/HeaderCopyableAddress";
import { isValidIpfsUrl, toIpfsUrl, isVideoUrl } from "@/store/utils";
import { cn } from "@/utils/styling";

interface TokenHeaderProps {
  isLoading: boolean;
  tokenName?: string;
  tokenId: string;
  tokenUri?: string;
  tokenStandard?: string;
  className?: string;
}

export function TokenHeader({
  isLoading,
  tokenName,
  tokenId,
  tokenUri,
  tokenStandard,
  className,
}: TokenHeaderProps) {
  const [mediaState, setMediaState] = useState<"image" | "video" | "fallback">("image");

  let parsedUrl = tokenUri ?? "";
  if (isValidIpfsUrl(parsedUrl)) {
    parsedUrl = toIpfsUrl(parsedUrl);
  }

  const hasUri = !!tokenUri;
  const isKnownVideo = isVideoUrl(parsedUrl);
  const showVideo = hasUri && (isKnownVideo || mediaState === "video");
  const showImage = hasUri && !isKnownVideo && mediaState === "image";

  return (
    <div className={cn("flex items-start gap-3 sm:items-center sm:gap-4 mb-6", className)}>
      {/* Token Image - Small thumbnail */}
      <div className="shrink-0 hidden sm:block">
        {isLoading ? (
          <EnhancedSkeleton className="w-16 h-16 rounded-lg" />
        ) : showVideo ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md">
            <video src={parsedUrl} className="w-full h-full object-cover" muted preload="metadata" playsInline onError={() => setMediaState("fallback")} />
          </div>
        ) : showImage ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md">
            <img src={parsedUrl} alt={tokenName || "Token"} className="w-full h-full object-cover" onError={() => setMediaState("video")} />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md bg-muted flex items-center justify-center p-2">
            <span className="text-xs font-semibold text-muted-foreground text-center break-words line-clamp-3">
              {tokenName || "Token"}
            </span>
          </div>
        )}
      </div>
      <div className="shrink-0 sm:hidden">
        {isLoading ? (
          <EnhancedSkeleton className="w-12 h-12 rounded-lg" />
        ) : showVideo ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-md">
            <video src={parsedUrl} className="w-full h-full object-cover" muted preload="metadata" playsInline onError={() => setMediaState("fallback")} />
          </div>
        ) : showImage ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-md">
            <img src={parsedUrl} alt={tokenName || "Token"} className="w-full h-full object-cover" onError={() => setMediaState("video")} />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-md bg-muted flex items-center justify-center p-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground text-center break-words line-clamp-2">
              {tokenName || "Token"}
            </span>
          </div>
        )}
      </div>

      {/* Title and Address */}
      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {isLoading ? (
            <EnhancedSkeleton className="h-7 w-48" />
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-heading font-semibold text-foreground">
                {tokenName || "Token"}
              </h1>
              {tokenStandard && (
                <Badge variant="outline" className="text-xs uppercase">
                  {tokenStandard}
                </Badge>
              )}
            </>
          )}
        </div>
        {/* Address row */}
        <div className="flex items-center gap-2 flex-wrap">
          <HeaderCopyableAddress address={tokenId} />
        </div>
      </div>
    </div>
  );
}
