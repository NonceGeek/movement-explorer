"use client";

import { FileText, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { cn } from "@/lib/utils";
import {
  getTransactionSender,
  getTransactionCounterparty,
  getTransactionAmount,
  getTransactionFunction,
  formatMoveAmount,
} from "@/utils/transaction";
import { formatAge, formatDateTimeUTC } from "@/utils/time";
import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";
import { Types } from "aptos";
import { TransactionFunction } from "@/components/common/TransactionFunction";

export interface UserTransactionRowProps {
  version: number;
  transactionData?: Types.Transaction;
  timestampMode?: "age" | "dateTime";
  className?: string;
}

/**
 * UserTransactionRowCells - Returns only the TableCell contents (without TableRow wrapper)
 * Used by parent components that need to wrap with motion.tr for animations
 */
export function UserTransactionRowCells({
  version,
  transactionData,
  timestampMode = "age",
}: Omit<UserTransactionRowProps, "className">) {
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
      <TableCell colSpan={7}>
        <Skeleton className="h-8 w-full" />
      </TableCell>
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
    <>
      {/* Version + Status Icon */}
      <TableCell>
        <div className="flex items-center gap-2">
          {status ? (
            <CheckCircle2 className="h-4 w-4 text-guild-green-500 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-oracle-orange-500 shrink-0" />
          )}
          <CopyableAddress
            address={transaction?.hash || ""}
            href={`/txn/${transaction?.hash}`}
            className="text-primary hover:underline font-mono group-hover:text-guild-green-500 transition-colors"
            truncateLength={{ start: 6, end: 6 }}
          />
        </div>
      </TableCell>
      {/* Timestamp */}
      <TableCell className="text-muted-foreground text-sm group-hover:text-guild-green-500/90 transition-colors whitespace-nowrap">
        {timestamp
          ? timestampMode === "age"
            ? formatAge(timestamp)
            : formatDateTimeUTC(timestamp)
          : "-"}
      </TableCell>
      {/* Sender */}
      <TableCell>
        {sender ? (
          <CopyableAddress address={sender} href={`/account/${sender}`} />
        ) : (
          <span className="text-muted-foreground group-hover:text-guild-green-500/70 transition-colors">
            -
          </span>
        )}
      </TableCell>
      {/* Receiver */}
      <TableCell className="hidden md:table-cell">
        {counterparty ? (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {counterparty.role === "smartContract" ? (
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-guild-green-500/90 transition-colors" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-guild-green-500/90 transition-colors" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {counterparty.role === "smartContract"
                    ? "Smart Contract"
                    : "Receiver"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <CopyableAddress
              address={counterparty.address}
              href={`/account/${counterparty.address}`}
            />
          </div>
        ) : (
          <span className="text-muted-foreground group-hover:text-guild-green-500/70 transition-colors">
            -
          </span>
        )}
      </TableCell>
      {/* Function */}
      <TableCell className="hidden sm:table-cell">
        {functionName ? (
          <TransactionFunction transaction={transaction} />
        ) : (
          <span className="text-muted-foreground group-hover:text-guild-green-500/70 transition-colors">
            -
          </span>
        )}
      </TableCell>
      {/* Amount */}
      <TableCell className="hidden lg:table-cell text-right">
        {amount !== undefined && amount > 0 ? (
          <span className="font-mono group-hover:text-guild-green-500 transition-colors">
            {formatMoveAmount(amount)} MOVE
          </span>
        ) : (
          <span className="text-muted-foreground group-hover:text-guild-green-500/70 transition-colors">
            -
          </span>
        )}
      </TableCell>
      {/* Gas */}
      <TableCell className="hidden lg:table-cell text-right">
        {gasUsed && gasUnitPrice ? (
          <span className="font-mono text-sm text-muted-foreground group-hover:text-guild-green-500/80 transition-colors">
            {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
          </span>
        ) : (
          <span className="text-muted-foreground group-hover:text-guild-green-500/70 transition-colors">
            -
          </span>
        )}
      </TableCell>
    </>
  );
}

/**
 * UserTransactionRow - Full table row component (backward compatible)
 * Wraps UserTransactionRowCells with a TableRow
 */
export function UserTransactionRow({
  version,
  transactionData,
  timestampMode = "age",
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
        <TableCell colSpan={7}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!transaction || isError) {
    return null;
  }

  return (
    <TableRow
      className={cn(
        "hover:bg-guild-green-500/10 group transition-colors border-b border-border/30 h-14",
        className,
      )}
    >
      <UserTransactionRowCells
        version={version}
        transactionData={transaction}
        timestampMode={timestampMode}
      />
    </TableRow>
  );
}
