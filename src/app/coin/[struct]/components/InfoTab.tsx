"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { SupplyType } from "@/hooks/coins/useGetCoinSupplyLimit";
import { CoinDescription } from "@/hooks/coins/types";
import { formatMoveAmount } from "@/utils/transaction";
import {
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CoinData {
  type: string;
  data: {
    decimals: number;
    name: string;
    symbol: string;
    supply?: {
      vec: [
        {
          aggregator?: { vec: [{ handle: string; key: string }] };
          integer?: { vec: [{ limit: string; value: string }] };
        }
      ];
    };
  };
}

interface InfoTabProps {
  struct: string;
  coinData: CoinData | undefined;
  coinDescription: CoinDescription | undefined;
  supplyInfo: [bigint | null, SupplyType | null];
  pairedFa: string | null;
  isLoading: boolean;
}

function SupplyIcon({ supplyType }: { supplyType: SupplyType | null }) {
  switch (supplyType) {
    case SupplyType.ON_CHAIN:
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle2 className="h-4 w-4 text-guild-green-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Supply tracked on-chain, may change over time</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case SupplyType.VERIFIED_OFF_CHAIN:
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <BadgeCheck className="h-4 w-4 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Supply verified off-chain to have a fixed supply</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case SupplyType.NO_SUPPLY_TRACKED:
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>No supply is tracked for this coin on-chain or off-chain</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    default:
      return null;
  }
}

export default function InfoTab({
  struct,
  coinData,
  coinDescription,
  supplyInfo,
  pairedFa,
  isLoading,
}: InfoTabProps) {
  const address = struct.split("::")[0];
  const [supply, supplyType] = supplyInfo;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!coinData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No coin data found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{coinData.data.name}</span>
        </div>

        {/* Symbol */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Symbol</span>
          <Badge variant="secondary">{coinData.data.symbol}</Badge>
        </div>

        {/* Decimals */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Decimals</span>
          <span className="font-mono">{coinData.data.decimals}</span>
        </div>

        {/* Total Supply */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Total Supply</span>
          <div className="flex items-center gap-2">
            {supply !== null ? (
              <>
                <span className="font-mono">
                  {formatMoveAmount(supply)} {coinData.data.symbol}
                </span>
                <SupplyIcon supplyType={supplyType} />
              </>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                Not tracked
                <SupplyIcon supplyType={supplyType} />
              </span>
            )}
          </div>
        </div>

        {/* Creator */}
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Creator</span>
          <CopyableAddress
            address={address}
            href={`/account/${address}`}
            variant="label"
            showLabel
            truncateLength={{ start: 8, end: 6 }}
          />
        </div>

        {/* Paired FA */}
        {pairedFa && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Paired Fungible Asset</span>
            <CopyableAddress
              address={pairedFa}
              href={`/fa/${pairedFa}`}
              variant="label"
              truncateLength={{ start: 8, end: 6 }}
            />
          </div>
        )}

        {/* Icon */}
        {coinDescription?.logoUrl && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Icon</span>
            <img
              src={coinDescription.logoUrl}
              alt={coinData.data.name}
              className="w-16 h-16 rounded"
            />
          </div>
        )}

        {/* Website */}
        {coinDescription?.websiteUrl && (
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Website</span>
            <a
              href={coinDescription.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {coinDescription.websiteUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
