"use client";

import Link from "next/link";
import { FileText, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatTimestamp,
  getTransactionTypeName,
  getTransactionSender,
  getTransactionCounterparty,
  getTransactionAmount,
  getTransactionFunction,
  formatMoveAmount,
} from "@/utils/transaction";
import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";

import { Types } from "aptos";

export interface UserTransactionRowProps {
  version: number;
  transactionData?: Types.Transaction;
  className?: string;
}

export function UserTransactionRow({
  version,
  transactionData,
  className,
}: UserTransactionRowProps) {
  const {
    data: fetchedTransaction,
    isError,
    isLoading,
  } = useGetTransaction(version.toString(), {
    enabled: !transactionData,
  });

  const transaction = transactionData || fetchedTransaction;

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!transaction || isError) {
    return null;
  }

  const status = "success" in transaction ? transaction.success : true;
  const sender = getTransactionSender(transaction);
  const timestamp = "timestamp" in transaction ? transaction.timestamp : null;
  const counterparty = getTransactionCounterparty(transaction);
  const amount = getTransactionAmount(transaction);
  const functionName = getTransactionFunction(transaction);
  const gasUsed = "gas_used" in transaction ? transaction.gas_used : null;
  const gasUnitPrice =
    "gas_unit_price" in transaction ? transaction.gas_unit_price : null;

  return (
    <TableRow className={className}>
      {/* Version + Status */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Link
            href={`/txn/${version}`}
            className="text-primary hover:underline font-mono"
          >
            {version}
          </Link>
          {status ? (
            <Badge variant="success" className="gap-1 pl-1.5">
              <CheckCircle2 className="h-3 w-3" /> Success
            </Badge>
          ) : (
            <Badge variant="error" className="gap-1 pl-1.5">
              <XCircle className="h-3 w-3" /> Failed
            </Badge>
          )}
        </div>
      </TableCell>
      {/* Timestamp */}
      <TableCell className="text-muted-foreground text-sm">
        {timestamp ? formatTimestamp(timestamp) : "-"}
      </TableCell>
      {/* Sender */}
      <TableCell>
        {sender ? (
          <Link
            href={`/account/${sender}`}
            className="text-primary hover:underline font-mono text-sm"
          >
            {sender.slice(0, 8)}...{sender.slice(-6)}
          </Link>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {/* Receiver */}
      <TableCell>
        {counterparty ? (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {counterparty.role === "smartContract" ? (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {counterparty.role === "smartContract"
                    ? "Smart Contract"
                    : "Receiver"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Link
              href={`/account/${counterparty.address}`}
              className="text-primary hover:underline font-mono text-sm"
            >
              {counterparty.address.slice(0, 8)}...
              {counterparty.address.slice(-6)}
            </Link>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {/* Function */}
      <TableCell>
        {functionName ? (
          <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
            {functionName}
          </code>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      {/* Amount + Gas */}
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          {amount !== undefined && amount > 0 ? (
            <span className="font-mono">{formatMoveAmount(amount)} MOVE</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          {gasUsed && gasUnitPrice && (
            <span className="text-xs text-muted-foreground">
              Gas {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
