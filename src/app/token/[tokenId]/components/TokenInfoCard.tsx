import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { OwnersRow } from "./OwnersRow";
import { isValidUrl, isValidIpfsUrl, toIpfsUrl } from "@/store/utils";
import { TokenData } from "@/hooks/tokens/useGetTokenData";

interface TokenInfoCardProps {
  token: TokenData;
  tokenId: string;
}

export function TokenInfoCard({ token, tokenId }: TokenInfoCardProps) {
  const [metadataIsImage, setMetadataIsImage] = useState<boolean>(true);

  // Parse token URI for metadata display
  let parsedUrl = token.token_uri ?? "";
  if (isValidIpfsUrl(parsedUrl)) {
    parsedUrl = toIpfsUrl(parsedUrl);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{token.token_name}</span>
        </div>

        {/* Owners */}
        <OwnersRow tokenId={tokenId} />

        {/* Token Standard */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Standard</span>
          <Badge variant="secondary">{token.token_standard}</Badge>
        </div>

        {/* Metadata */}
        <div className="py-2 border-b">
          <span className="text-muted-foreground block mb-2">Metadata</span>
          {metadataIsImage && parsedUrl ? (
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
              className="text-primary hover:underline flex items-center gap-1 text-sm break-all"
            >
              {token.token_uri}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : token.token_uri ? (
            <span className="text-sm text-muted-foreground break-all">
              {token.token_uri}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>

        {/* Collection ID (v2) */}
        {token.token_standard === "v2" && token.current_collection?.collection_id && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Collection ID</span>
            <span className="font-mono text-xs truncate max-w-[200px]">
              {token.current_collection.collection_id}
            </span>
          </div>
        )}

        {/* Token ID (v2) */}
        {token.token_standard === "v2" && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Token ID</span>
            <span className="font-mono text-xs truncate max-w-[200px]">
              {token.token_data_id}
            </span>
          </div>
        )}

        {/* Largest Property Version (v1) */}
        {token.largest_property_version_v1 && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">
              Largest Property Version
            </span>
            <span className="font-mono">
              {token.largest_property_version_v1}
            </span>
          </div>
        )}

        {/* Supply */}
        {token.current_collection?.current_supply !== undefined && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Supply</span>
            <span className="font-mono">
              {token.current_collection.current_supply}
            </span>
          </div>
        )}

        {/* Maximum */}
        {token.current_collection &&
          token.current_collection.max_supply !== null &&
          token.current_collection.max_supply !== undefined && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Maximum</span>
              <span className="font-mono">
                {token.current_collection.max_supply}
              </span>
            </div>
          )}

        {/* Last Transaction */}
        {token.last_transaction_version && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Last Transaction</span>
            <Link
              href={`/txn/${token.last_transaction_version}`}
              className="text-primary hover:underline font-mono"
            >
              {token.last_transaction_version}
            </Link>
          </div>
        )}

        {/* Fungible */}
        <div className="flex justify-between items-center py-2">
          <span className="text-muted-foreground">Fungible</span>
          <Badge variant={token.is_fungible_v2 ? "default" : "secondary"}>
            {token.is_fungible_v2 ? "Yes" : "No"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
