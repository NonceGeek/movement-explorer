"use client";

import { Card } from "@/components/ui/card";
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
    <Card className="bg-card border-border mb-8 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/40">
        {/* Column 1: Overview */}
        <div className="px-5 py-4 space-y-3">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            Overview
          </h3>
          <div className="space-y-2.5">
            {/* Total Supply */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="h-3 w-3" />
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
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Price
                </span>
                {isLoading ? (
                  <EnhancedSkeleton className="h-4 w-20" />
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
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  Market Cap
                </span>
                {isLoading ? (
                  <EnhancedSkeleton className="h-4 w-24" />
                ) : (
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
                    {marketCap}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Token Info */}
        <div className="px-5 py-4 space-y-3">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            Token Info
          </h3>
          <div className="space-y-2.5">
            {/* Decimals */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                Decimals
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-4 w-8" />
              ) : (
                <span className="text-sm font-medium tabular-nums">
                  {decimals}
                </span>
              )}
            </div>

            {/* Category */}
            {category && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  Category
                </span>
                {isLoading ? (
                  <EnhancedSkeleton className="h-4 w-16" />
                ) : (
                  <span className="text-sm font-medium">{category}</span>
                )}
              </div>
            )}

            {/* Tags */}
            {displayTags && displayTags.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Tag className="h-3 w-3" />
                  Tags
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {displayTags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {displayTags.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      +{displayTags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: More Info */}
        <div className="px-5 py-4 space-y-3">
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
            More Info
          </h3>
          <div className="space-y-2.5">
            {/* Creator / Object Details */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <User className="h-3 w-3" />
                {identifierLabel}
              </span>
              {isLoading ? (
                <EnhancedSkeleton className="h-4 w-24" />
              ) : (
                <CopyableAddress
                  address={creatorAddress || identifier}
                  href={creatorAddress ? `/account/${creatorAddress}` : identifierHref}
                  className="text-xs"
                  truncateLength={{ start: 6, end: 4 }}
                />
              )}
            </div>

            {/* Paired Asset */}
            {pairedAsset && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Link2 className="h-3 w-3" />
                  {pairedAsset.label}
                </span>
                {isLoading ? (
                  <EnhancedSkeleton className="h-4 w-24" />
                ) : (
                  <CopyableAddress
                    address={pairedAsset.address}
                    href={pairedAsset.href}
                    className="text-xs"
                    truncateLength={{ start: 6, end: 4 }}
                  />
                )}
              </div>
            )}

            {/* Website */}
            {websiteUrl && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Globe className="h-3 w-3" />
                  Website
                </span>
                {isLoading ? (
                  <EnhancedSkeleton className="h-4 w-24" />
                ) : (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 truncate max-w-[150px]"
                  >
                    {new URL(websiteUrl).hostname}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
