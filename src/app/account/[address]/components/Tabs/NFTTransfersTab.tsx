"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Types } from "aptos";
import { useGlobalStore } from "@/store/useGlobalStore";
import { getTransaction } from "@/services";
import {
  useGetAccountNFTTransfers,
  NFTActivity,
} from "@/hooks/accounts/useGetAccountNFTTransfers";
import { useGetAccountNFTTransfersCount } from "@/hooks/accounts/useGetAccountNFTTransfersCount";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { TimestampModeToggle } from "@/components/common/TimestampModeToggle";
import { TimestampToggle } from "@/components/common/TimestampToggle";
import {
  TransactionTypeName,
  TRANSACTION_TYPE_INFO,
} from "@/constants/transaction";
import { EmptyState } from "..";
import { ImageIcon, CircleCheckBig, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  StyledTableRow,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { EnhancedSkeleton } from "@/components/ui/skeleton";

const MAX_DISPLAY = 25;

/**
 * Extract short activity name from full event type string.
 * e.g. "0x4::collection::MintEvent" → "Mint"
 *      "0x1::object::TransferEvent" → "Transfer"
 */
function getActivityName(type: string): string {
  const parts = type.split("::");
  const eventName = parts[parts.length - 1] || type;
  return eventName.replace(/Event$/, "");
}

/**
 * Get color classes for activity type badge
 */
function getActivityStyle(activityName: string): string {
  switch (activityName.toLowerCase()) {
    case "mint":
      return "bg-guild-green-500/15 text-guild-green-500 border-guild-green-500/30";
    case "burn":
      return "bg-oracle-orange-500/15 text-oracle-orange-500 border-oracle-orange-500/30";
    case "transfer":
      return "bg-blue-500/15 text-blue-500 border-blue-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

interface NFTTransfersTabProps {
  address: string;
}

export default function NFTTransfersTab({ address }: NFTTransfersTabProps) {
  const { data: totalCount } = useGetAccountNFTTransfersCount(address);
  const { data: activities, isLoading: activitiesLoading } =
    useGetAccountNFTTransfers(address, MAX_DISPLAY, 0);

  // Extract unique transaction versions to fetch full transaction details
  const uniqueVersions = useMemo(() => {
    if (!activities) return [];
    return [...new Set(activities.map((a) => a.transaction_version))];
  }, [activities]);

  // Fetch full transaction details via REST API (for hash, status, type icon)
  const { aptos_client } = useGlobalStore();
  const { data: transactions, isLoading: txDetailsLoading } = useQuery({
    queryKey: ["accountNFTTransferDetails", address, uniqueVersions],
    queryFn: async () => {
      if (uniqueVersions.length === 0) return [];
      return Promise.all(
        uniqueVersions.map((v) =>
          getTransaction({ txnHashOrVersion: v }, aptos_client),
        ),
      );
    },
    enabled: uniqueVersions.length > 0,
  });

  // Build version → transaction lookup
  const txMap = useMemo(() => {
    const map = new Map<number, Types.Transaction>();
    if (!transactions) return map;
    for (const tx of transactions) {
      if ("version" in tx) {
        map.set(parseInt(tx.version), tx);
      }
    }
    return map;
  }, [transactions]);

  const [timestampMode, setTimestampMode] = useState<"age" | "dateTime">("age");

  const isLoading = activitiesLoading || txDetailsLoading;
  const displayCount = totalCount ?? (activities?.length || 0);

  if (!isLoading && (!activities || activities.length === 0)) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-12 w-12" />}
        title="No NFT Transfers Yet"
        description="This account hasn't had any NFT transfer activities on the network."
      />
    );
  }

  return (
    <div className="space-y-4">
      {displayCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Latest {Math.min(MAX_DISPLAY, displayCount).toLocaleString()} from a
            total of{" "}
            {displayCount > MAX_DISPLAY ? (
              <Link
                href={`/nft-transfers?address=${address}`}
                className="font-medium text-primary hover:underline"
              >
                {displayCount.toLocaleString()}
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                {displayCount.toLocaleString()}
              </span>
            )}{" "}
            NFT transfers
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <StyledTable>
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead className="w-[170px]">Txn Hash</StyledTableHead>
              <StyledTableHead className="w-[155px]">
                <TimestampModeToggle
                  mode={timestampMode}
                  setMode={setTimestampMode}
                />
              </StyledTableHead>
              <StyledTableHead className="w-[100px]">Activity</StyledTableHead>
              <StyledTableHead className="w-[180px]">Token</StyledTableHead>
              <StyledTableHead className="w-[150px]">From</StyledTableHead>
              <StyledTableHead className="w-[150px]">To</StyledTableHead>
              <StyledTableHead className="w-[80px] text-right">
                Amount
              </StyledTableHead>
            </StyledTableHeaderRow>
          </StyledTableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: MAX_DISPLAY }).map((_, i) => (
                  <TableRow key={i} className="h-16">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <EnhancedSkeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : (activities || []).map((activity) => (
                  <NFTActivityRow
                    key={`${activity.transaction_version}-${activity.event_index}`}
                    activity={activity}
                    transaction={txMap.get(activity.transaction_version)}
                    timestampMode={timestampMode}
                    onToggleTimestampMode={() =>
                      setTimestampMode((prev) =>
                        prev === "age" ? "dateTime" : "age",
                      )
                    }
                  />
                ))}
          </TableBody>
        </StyledTable>
      </div>

      {!isLoading && displayCount > MAX_DISPLAY && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/nft-transfers?address=${address}`}
            >
              View all {displayCount.toLocaleString()} NFT transfers
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function NFTActivityRow({
  activity,
  transaction,
  timestampMode,
  onToggleTimestampMode,
}: {
  activity: NFTActivity;
  transaction: Types.Transaction | undefined;
  timestampMode: "age" | "dateTime";
  onToggleTimestampMode: () => void;
}) {
  const router = useRouter();
  const activityName = getActivityName(activity.type);
  const activityStyle = getActivityStyle(activityName);

  // Transaction details from REST API
  const txHash = transaction?.hash || "";
  const status = transaction && "success" in transaction ? transaction.success : true;
  const txType = (transaction?.type || "unknown") as TransactionTypeName;
  const typeInfo =
    TRANSACTION_TYPE_INFO[txType] ??
    TRANSACTION_TYPE_INFO[TransactionTypeName.Unknown];
  const timestamp = transaction && "timestamp" in transaction ? transaction.timestamp : activity.transaction_timestamp;

  const tokenDisplay = activity.token_data_id
    ? activity.token_data_id.length > 20
      ? `${activity.token_data_id.slice(0, 10)}...${activity.token_data_id.slice(-8)}`
      : activity.token_data_id
    : "-";

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, [role="button"]')) return;
    router.push(`/txn/${txHash || activity.transaction_version}`);
  };

  return (
    <StyledTableRow
      className="cursor-pointer animate-in slide-in-from-top-2 fade-in duration-500"
      onClick={handleRowClick}
    >
      {/* Txn Hash — matches TransactionTableRow hash column */}
      <TableCell className="w-[170px]">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-foreground/80 shrink-0 cursor-default">
                  {typeInfo.icon}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium capitalize">
                  {typeInfo.label}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {typeInfo.description}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CopyableAddress
            address={txHash || String(activity.transaction_version)}
            href={`/txn/${txHash || activity.transaction_version}`}
            className="text-primary font-mono transition-colors"
            truncateLength={{ start: 10, end: 0 }}
            icon={
              status ? (
                <CircleCheckBig className="h-4 w-4 text-guild-green-500 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-oracle-orange-500 shrink-0" />
              )
            }
          />
        </div>
      </TableCell>

      {/* Age — matches TransactionTableRow timestamp column */}
      <TableCell className="text-foreground/80 text-sm whitespace-nowrap w-[155px]">
        <TimestampToggle
          timestamp={timestamp}
          timestampMode={timestampMode}
          onToggle={onToggleTimestampMode}
        />
      </TableCell>

      {/* Activity */}
      <TableCell className="w-[100px]">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${activityStyle}`}
        >
          {activityName}
        </span>
      </TableCell>

      {/* Token */}
      <TableCell className="w-[180px]">
        <span
          className="text-sm text-foreground/80 truncate max-w-[180px] inline-block"
          title={activity.token_data_id}
        >
          {tokenDisplay}
        </span>
      </TableCell>

      {/* From */}
      <TableCell className="w-[150px]">
        {activity.from_address ? (
          <CopyableAddress
            address={activity.from_address}
            href={`/account/${activity.from_address}`}
            className="text-primary"
            showLabel
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* To */}
      <TableCell className="w-[150px]">
        {activity.to_address ? (
          <CopyableAddress
            address={activity.to_address}
            href={`/account/${activity.to_address}`}
            className="text-primary"
            showLabel
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Amount */}
      <TableCell className="w-[80px] text-right">
        <span className="font-mono text-sm">
          {activity.token_amount ?? "-"}
        </span>
      </TableCell>
    </StyledTableRow>
  );
}
