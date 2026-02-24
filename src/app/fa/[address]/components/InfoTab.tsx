"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { formatMovementPath } from "@/utils";
import { formatMoveAmount } from "@/utils/transaction";
import { FaMetadata } from "@/hooks/coins/useGetFaMetadata";
import { CoinDescription } from "@/hooks/coins/types";
import { ExternalLink, CheckCircle2, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTabProps {
  address: string;
  metadata: FaMetadata | null;
  supply: bigint | null;
  pairedCoin?: string;
  coinDescription?: CoinDescription;
  displaySymbol?: string;
  isLoading: boolean;
}

function SupplyIcon({ hasSupply }: { hasSupply: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {hasSupply ? (
            <CheckCircle2 className="h-4 w-4 text-guild-green-500" />
          ) : (
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {hasSupply
              ? "Supply tracked on-chain, may change over time"
              : "No supply is tracked for this asset"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function InfoTab({
  address,
  metadata,
  supply,
  pairedCoin,
  coinDescription,
  displaySymbol,
  isLoading,
}: InfoTabProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <EnhancedSkeleton className="h-5 w-24" />
              <EnhancedSkeleton className="h-5 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!metadata && !coinDescription) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No fungible asset data found</p>
        </CardContent>
      </Card>
    );
  }

  const decimals = metadata?.decimals ?? coinDescription?.decimals ?? 8;
  const symbol = displaySymbol ?? metadata?.symbol ?? coinDescription?.symbol ?? "";
  const iconUri = metadata?.icon_uri || coinDescription?.logoUrl;
  const projectUrl = coinDescription?.websiteUrl || metadata?.project_uri;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fungible Asset Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">
            {metadata?.name || coinDescription?.name || "Unknown"}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Symbol</span>
          <Badge variant="secondary">{symbol || "Unknown"}</Badge>
        </div>

        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Decimals</span>
          <span className="font-mono tabular-nums">{decimals}</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Total Supply</span>
          <div className="flex items-center gap-2">
            {supply !== null ? (
              <>
                <span className="font-mono tabular-nums">
                  {formatMoveAmount(supply, decimals)} {symbol}
                </span>
                <SupplyIcon hasSupply />
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Not tracked</span>
                <SupplyIcon hasSupply={false} />
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Object Details</span>
          <CopyableAddress
            address={address}
            href={`/object/${address}`}
            variant="label"
            showLabel
            truncateLength={{ start: 8, end: 6 }}
          />
        </div>

        {pairedCoin && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Paired Coin</span>
            <CopyableAddress
              address={pairedCoin}
              href={`/coin/${formatMovementPath(pairedCoin)}`}
              variant="label"
              truncateLength={{ start: 8, end: 6 }}
            />
          </div>
        )}

        {iconUri && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Icon</span>
            <img
              src={iconUri}
              alt={metadata?.name || "Fungible Asset"}
              className="w-16 h-16 rounded"
            />
          </div>
        )}

        {projectUrl && (
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Project URL</span>
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {projectUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
