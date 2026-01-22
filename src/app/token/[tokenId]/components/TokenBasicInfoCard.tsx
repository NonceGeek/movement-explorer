"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { OwnersRow } from "./OwnersRow";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { isValidUrl, isValidIpfsUrl, toIpfsUrl } from "@/store/utils";
import { TokenData } from "@/hooks/tokens/useGetTokenData";

interface TokenBasicInfoCardProps {
  token: TokenData;
  tokenId: string;
}

// Content row component for displaying key-value pairs
function ContentRow({
  title,
  value,
  isLast = false,
}: {
  title: string;
  value: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-start py-3 ${!isLast ? "border-b border-border/50" : ""}`}
    >
      <span className="text-muted-foreground shrink-0">{title}</span>
      <div className="text-right ml-4">{value}</div>
    </div>
  );
}

export function TokenBasicInfoCard({ token, tokenId }: TokenBasicInfoCardProps) {
  const [metadataIsImage, setMetadataIsImage] = useState<boolean>(true);

  // Parse token URI for metadata display (support IPFS)
  let parsedUrl = token.token_uri ?? "";
  if (isValidIpfsUrl(parsedUrl)) {
    parsedUrl = toIpfsUrl(parsedUrl);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Token Information</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Token Name with standard badge */}
        <ContentRow
          title="Token Name:"
          value={
            <div className="flex items-center gap-2 justify-end">
              <span className="font-medium">{token.token_name || "N/A"}</span>
              <Badge variant="outline" className="text-xs">
                {token.token_standard}
              </Badge>
            </div>
          }
        />

        {/* Owners */}
        <OwnersRow tokenId={tokenId} />

        {/* Collection Name */}
        <ContentRow
          title="Collection Name:"
          value={
            <span className="font-medium">
              {token.current_collection?.collection_name || "N/A"}
            </span>
          }
        />

        {/* Creator */}
        <ContentRow
          title="Creator:"
          value={
            token.current_collection?.creator_address ? (
              <CopyableAddress
                address={token.current_collection.creator_address}
                href={`/account/${token.current_collection.creator_address}`}
                variant="label"
                showLabel
                truncateLength={{ start: 6, end: 4 }}
              />
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )
          }
        />

        {/* Metadata (image or link) */}
        <ContentRow
          title="Metadata:"
          value={
            metadataIsImage && parsedUrl ? (
              <a href={parsedUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={parsedUrl}
                  alt={token.token_name}
                  className="max-w-[150px] rounded-lg"
                  onError={() => setMetadataIsImage(false)}
                  loading="lazy"
                />
              </a>
            ) : isValidUrl(token.token_uri || "") ? (
              <a
                href={token.token_uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-sm break-all justify-end"
              >
                {token.token_uri}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : token.token_uri ? (
              <span className="text-sm break-all">{token.token_uri}</span>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )
          }
          isLast
        />
      </CardContent>
    </Card>
  );
}
