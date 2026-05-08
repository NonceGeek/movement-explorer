"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  StyledTableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useGetDelegatedStakeOperationActivities } from "@/hooks/staking/useGetDelegatedStakeOperationActivities";
import { formatMoveAmount } from "@/utils/transaction";
import Link from "next/link";
import { Activity } from "lucide-react";

interface StakeOperationActivitiesProps {
  validatorAddress: string;
}

function formatEventType(eventType: string): string {
  if (eventType.includes("AddStakeEvent")) return "Stake";
  if (eventType.includes("UnlockStakeEvent")) return "Unlock";
  if (eventType.includes("WithdrawStakeEvent")) return "Withdraw";
  if (eventType.includes("ReactivateStakeEvent")) return "Reactivate";
  if (eventType.includes("DistributeCommissionEvent")) return "Commission";
  return eventType.split("::").pop() || eventType;
}

function getBadgeVariant(
  eventType: string,
): "success" | "warning" | "error" | "default" {
  if (eventType.includes("AddStakeEvent")) return "success";
  if (eventType.includes("UnlockStakeEvent")) return "warning";
  if (eventType.includes("WithdrawStakeEvent")) return "error";
  if (eventType.includes("ReactivateStakeEvent")) return "success";
  return "default";
}

export function StakeOperationActivities({
  validatorAddress,
}: StakeOperationActivitiesProps) {
  const { connected, account } = useWallet();

  const { activities, loading, error } =
    useGetDelegatedStakeOperationActivities(
      account?.address?.toString() || "",
      validatorAddress,
    );

  if (!connected) return null;

  return (
    <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-300">
      <div className="border-b border-border/30 py-4 px-5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Staking Activity History
        </span>
      </div>
      <div>
        {loading ? (
          <StyledTable>
            <StyledTableHeader>
              <StyledTableHeaderRow>
                <StyledTableHead>Event Type</StyledTableHead>
                <StyledTableHead className="text-right">Amount</StyledTableHead>
                <StyledTableHead className="text-right">Transaction</StyledTableHead>
              </StyledTableHeaderRow>
            </StyledTableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <StyledTableRow key={i}>
                  <TableCell><EnhancedSkeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><EnhancedSkeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell className="text-right"><EnhancedSkeleton className="h-4 w-20 ml-auto" /></TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </StyledTable>
        ) : error ? (
          <div className="p-6">
            <p className="text-muted-foreground text-sm">
              Failed to load staking activities.
            </p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6">
            <p className="text-muted-foreground text-sm">
              No staking activities found.
            </p>
          </div>
        ) : (
          <StyledTable>
            <StyledTableHeader>
              <StyledTableHeaderRow>
                <StyledTableHead>Event Type</StyledTableHead>
                <StyledTableHead className="text-right">
                  Amount
                </StyledTableHead>
                <StyledTableHead className="text-right">
                  Transaction
                </StyledTableHead>
              </StyledTableHeaderRow>
            </StyledTableHeader>
            <TableBody>
              {activities.map((activity) => (
                <StyledTableRow
                  key={`${activity.transaction_version}-${activity.event_index}`}
                >
                  <TableCell>
                    <Badge variant={getBadgeVariant(activity.event_type)}>
                      {formatEventType(activity.event_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatMoveAmount(BigInt(activity.amount))} MOVE
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/txn/${activity.transaction_version}`}
                      className="text-primary hover:text-primary/80 font-mono text-sm transition-colors"
                    >
                      {activity.transaction_version}
                    </Link>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </StyledTable>
        )}
      </div>
    </div>
  );
}
