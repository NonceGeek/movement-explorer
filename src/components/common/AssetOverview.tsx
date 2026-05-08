"use client";

import { Badge } from "@/components/ui/badge";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { SupplyIcon } from "@/components/common/SupplyIcon";
import { formatMoveAmount } from "@/utils/transaction";
import { SupplyType } from "@/hooks/coins/useGetCoinSupplyLimit";
import {
  Coins,
  Hash,
  Tag,
  User,
  Link2,
  ExternalLink,
  DollarSign,
  Layers,
  Globe,
} from "lucide-react";

export interface AssetOverviewProps {
  // Basic info
  symbol: string;
  decimals: number;
  supply: bigint | null;
  supplyType?: SupplyType | null;
  hasSupply?: boolean;

  // Identity
  identifier: string;
  identifierLabel: string;
  identifierHref: string;

  // Links & Relations
  creatorAddress?: string;
  pairedAsset?: {
    address: string;
    href: string;
    label: string;
  };
  websiteUrl?: string;

  // Market data
  usdPrice?: string | null;
  category?: string;
  panoraTags?: string[];

  // State
  isLoading: boolean;
}

export function AssetOverview({
  symbol,
  decimals,
  supply,
  supplyType,
  hasSupply,
  identifier,
  identifierLabel,
  identifierHref,
  creatorAddress,
  pairedAsset,
  websiteUrl,
  usdPrice,
  category,
  panoraTags,
  isLoading,
}: AssetOverviewProps) {
  const formattedSupply =
    supply !== null ? formatMoveAmount(supply, decimals) : null;

  // Calculate market cap if we have both supply and price
  const marketCap =
    formattedSupply && usdPrice
      ? (
          parseFloat(formattedSupply.replace(/,/g, "")) * parseFloat(usdPrice)
        ).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })
      : null;

  // Filter valid tags for display
  const displayTags = panoraTags?.filter(
    (tag) => tag !== "Unverified" && tag !== "Banned" && tag !== "InternalFA",
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {/* Card 1: Overview */}
      <div className="p-4 md:p-5 bg-card backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <h3 className="text-xs text-muted-foreground font-medium tracking-wider mb-3">
          OVERVIEW
        </h3>
        <div className="space-y-2.5">
          {/* Total Supply */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              Total Supply
            </span>
            {isLoading ? (
              <EnhancedSkeleton className="h-5 w-32" />
            ) : formattedSupply ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tabular-nums">
                  {formattedSupply} {symbol}
                </span>
                <SupplyIcon supplyType={supplyType} hasSupply={hasSupply} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">
                  Not tracked
                </span>
                <SupplyIcon
                  supplyType={supplyType}
                  hasSupply={hasSupply ?? false}
                />
              </div>
            )}
          </div>

          {/* USD Price */}
          {usdPrice && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Price
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-5 w-20" />
              ) : (
                <span className="text-sm font-medium tabular-nums">
                  ${parseFloat(usdPrice).toFixed(6)}
                </span>
              )}
            </div>
          )}

          {/* Market Cap */}
          {marketCap && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Market Cap
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-5 w-24" />
              ) : (
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  {marketCap}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Token Info */}
      <div className="p-4 md:p-5 bg-card backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <h3 className="text-xs text-muted-foreground font-medium tracking-wider mb-3">
          TOKEN INFO
        </h3>
        <div className="space-y-2.5">
          {/* Decimals */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              Decimals
            </span>
            {isLoading ? (
              <EnhancedSkeleton className="h-5 w-8" />
            ) : (
              <span className="text-sm font-medium tabular-nums">
                {decimals}
              </span>
            )}
          </div>

          {/* Category */}
          {category && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                Category
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-5 w-16" />
              ) : (
                <span className="text-sm font-medium">{category}</span>
              )}
            </div>
          )}

          {/* Tags */}
          {displayTags && displayTags.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </span>
              <div className="flex flex-wrap gap-1 justify-end">
                {displayTags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
                {displayTags.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                  >
                    +{displayTags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: More Info */}
      <div className="p-4 md:p-5 bg-card backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
        <h3 className="text-xs text-muted-foreground font-medium tracking-wider mb-3">
          MORE INFO
        </h3>
        <div className="space-y-2.5">
          {/* Creator / Object Details */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
              <User className="h-3.5 w-3.5" />
              {identifierLabel}
            </span>
            {isLoading ? (
              <EnhancedSkeleton className="h-5 w-24" />
            ) : (
              <CopyableAddress
                address={creatorAddress || identifier}
                href={creatorAddress ? `/account/${creatorAddress}` : identifierHref}
                className="text-sm"
                truncateLength={{ start: 6, end: 4 }}
              />
            )}
          </div>

          {/* Paired Asset */}
          {pairedAsset && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                <Link2 className="h-3.5 w-3.5" />
                {pairedAsset.label}
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-5 w-24" />
              ) : (
                <CopyableAddress
                  address={pairedAsset.address}
                  href={pairedAsset.href}
                  className="text-sm"
                  truncateLength={{ start: 6, end: 4 }}
                />
              )}
            </div>
          )}

          {/* Website */}
          {websiteUrl && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                <Globe className="h-3.5 w-3.5" />
                Website
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-5 w-24" />
              ) : (
                <a
                  href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 truncate max-w-[150px]"
                >
                  {(() => {
                    try {
                      const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
                      return new URL(url).hostname;
                    } catch {
                      return websiteUrl;
                    }
                  })()}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
