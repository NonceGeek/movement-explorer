"use client";

import { useState } from "react";
import Link from "next/link";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { DetailRow, DetailSection } from "@/app/txn/[hash]/components/DetailRow";
import { JsonViewer } from "@/components/ui/json-viewer";
import { ExternalLink, ZoomIn } from "lucide-react";
import { isValidIpfsUrl, toIpfsUrl, isVideoUrl } from "@/store/utils";
import { TokenData } from "@/hooks/tokens/useGetTokenData";
import { OwnersRow } from "./OwnersRow";

interface TokenDetailsSectionProps {
  token: TokenData;
  tokenId: string;
}

export function TokenDetailsSection({ token, tokenId }: TokenDetailsSectionProps) {
  const [mediaState, setMediaState] = useState<"image" | "video" | "fallback">("image");

  // Parse token URI
  let parsedUrl = token.token_uri ?? "";
  if (isValidIpfsUrl(parsedUrl)) {
    parsedUrl = toIpfsUrl(parsedUrl);
  }

  const hasUri = !!token.token_uri;
  const isKnownVideo = isVideoUrl(parsedUrl);
  const hasTokenProperties =
    token.token_properties && Object.keys(token.token_properties).length > 0;

  return (
    <div className="space-y-6">
      {/* Token Information */}
      <DetailSection title="Token Information">
        <DetailRow label="Token Name">
          <div className="flex items-center gap-2">
            <span className="font-medium">{token.token_name || "N/A"}</span>
            <Badge variant="outline" className="text-xs uppercase">
              {token.token_standard}
            </Badge>
          </div>
        </DetailRow>

        <OwnersRow tokenId={tokenId} />

        <DetailRow label="Creator">
          {token.current_collection?.creator_address ? (
            <CopyableAddress
              address={token.current_collection.creator_address}
              href={`/account/${token.current_collection.creator_address}`}
              showFull
              showLabel
            />
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </DetailRow>

        {/* Metadata / Image / Video */}
        <DetailRow label="Metadata" isLast>
          {hasUri && (isKnownVideo || mediaState === "video") ? (
            <div className="w-[240px] rounded-lg overflow-hidden">
              <video
                src={parsedUrl}
                className="w-full h-auto object-cover rounded-lg"
                muted
                loop
                autoPlay
                playsInline
                controls
                onError={() => setMediaState("fallback")}
              />
            </div>
          ) : hasUri && mediaState === "image" && !isKnownVideo ? (
            <PhotoProvider>
              <PhotoView src={parsedUrl}>
                <div className="relative w-[120px] h-[120px] rounded-lg overflow-hidden cursor-zoom-in group inline-block">
                  <img
                    src={parsedUrl}
                    alt={token.token_name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => setMediaState("video")}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </PhotoView>
            </PhotoProvider>
          ) : hasUri ? (
            <a
              href={parsedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-sm break-all"
            >
              {token.token_uri}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </DetailRow>
      </DetailSection>

      {/* Collection Information */}
      <DetailSection title="Collection">
        <DetailRow label="Collection Name">
          <span className="font-medium">
            {token.current_collection?.collection_name || "N/A"}
          </span>
        </DetailRow>

        {token.current_collection?.description && (
          <DetailRow label="Description">
            <span className="text-sm">{token.current_collection.description}</span>
          </DetailRow>
        )}

        {token.token_standard === "v2" && token.current_collection?.collection_id && (
          <DetailRow label="Collection ID">
            <CopyableAddress
              address={token.current_collection.collection_id}
              showFull
              variant="hash"
            />
          </DetailRow>
        )}

        {token.current_collection?.uri && (
          <DetailRow label="Collection URI" isLast>
            <a
              href={isValidIpfsUrl(token.current_collection.uri) ? toIpfsUrl(token.current_collection.uri) : token.current_collection.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-sm break-all"
            >
              {token.current_collection.uri}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </DetailRow>
        )}
      </DetailSection>

      {/* Token Details */}
      <DetailSection title="Token Details">
        {token.token_standard === "v2" && token.token_data_id && (
          <DetailRow label="Token ID">
            <CopyableAddress address={token.token_data_id} showFull variant="hash" />
          </DetailRow>
        )}

        {token.largest_property_version_v1 && (
          <DetailRow label="Largest Property Version">
            <span className="font-mono">{token.largest_property_version_v1}</span>
          </DetailRow>
        )}

        <DetailRow label="Supply">
          <span className="font-mono">
            {token.current_collection?.current_supply ?? "N/A"}
          </span>
        </DetailRow>

        <DetailRow label="Maximum">
          <span className="font-mono">
            {token.current_collection?.max_supply ?? "Unlimited"}
          </span>
        </DetailRow>

        {hasTokenProperties ? (
          <DetailRow label="Token Properties">
            <div className="max-w-full overflow-auto">
              <JsonViewer data={token.token_properties} initialDepth={1} />
            </div>
          </DetailRow>
        ) : (
          <DetailRow label="Token Properties">
            <span className="text-muted-foreground">None</span>
          </DetailRow>
        )}

        <DetailRow label="Last Transaction" isLast>
          {token.last_transaction_version ? (
            <Link
              href={`/txn/${token.last_transaction_version}`}
              className="text-primary hover:underline font-mono"
            >
              {token.last_transaction_version}
            </Link>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </DetailRow>
      </DetailSection>

      {/* Description */}
      {token.description && (
        <DetailSection title="Description">
          <DetailRow label="Token Description" isLast>
            <p className="text-sm whitespace-pre-wrap">{token.description}</p>
          </DetailRow>
        </DetailSection>
      )}
    </div>
  );
}
