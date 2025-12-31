"use client";

import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";
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
  const router = useRouter();

  const {
    data: fetchedTransaction,
    isError,
    isLoading,
  } = useGetTransaction(version.toString(), {
    enabled: !transactionData,
  });

  const transaction = transactionData || fetchedTransaction;

  // ... (loading and error checks)

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

  // ... (variable definitions)

  const status = "success" in transaction ? transaction.success : true;
  const sender = getTransactionSender(transaction);
  const timestamp = "timestamp" in transaction ? transaction.timestamp : null;
  const counterparty = getTransactionCounterparty(transaction);
  const amount = getTransactionAmount(transaction);
  const functionName = getTransactionFunction(transaction);
  const gasUsed = "gas_used" in transaction ? transaction.gas_used : null;
  const gasUnitPrice =
    "gas_unit_price" in transaction ? transaction.gas_unit_price : null;

  const handleRowClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on an interactive element
    if ((e.target as HTMLElement).closest("a, button")) return;
    router.push(`/txn/${version}`);
  };

  return (
    <TableRow
      className={cn(
        "cursor-pointer hover:bg-guild-green-500/50 group",
        className
      )}
      onClick={handleRowClick}
    >
      {/* Version + Status */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Link
            href={`/txn/${version}`}
            className="text-primary hover:underline font-mono group-hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
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
      <TableCell className="text-muted-foreground text-sm group-hover:text-white/90 transition-colors">
        {timestamp ? formatTimestamp(timestamp) : "-"}
      </TableCell>
      {/* Sender */}
      <TableCell>
        {sender ? (
          <Link
            href={`/account/${sender}`}
            className="text-primary hover:underline font-mono text-sm group-hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {sender.slice(0, 8)}...{sender.slice(-6)}
          </Link>
        ) : (
          <span className="text-muted-foreground group-hover:text-white/70 transition-colors">
            -
          </span>
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
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-white/90 transition-colors" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white/90 transition-colors" />
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
              className="text-primary hover:underline font-mono text-sm group-hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {counterparty.address.slice(0, 8)}...
              {counterparty.address.slice(-6)}
            </Link>
          </div>
        ) : (
          <span className="text-muted-foreground group-hover:text-white/70 transition-colors">
            -
          </span>
        )}
      </TableCell>
      {/* Function */}
      <TableCell>
        {functionName ? (
          <code className="px-2 py-1 bg-muted rounded text-xs font-mono group-hover:bg-white/20 group-hover:text-white transition-colors">
            {functionName}
          </code>
        ) : (
          <span className="text-muted-foreground group-hover:text-white/70 transition-colors">
            -
          </span>
        )}
      </TableCell>
      {/* Amount + Gas */}
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          {amount !== undefined && amount > 0 ? (
            <span className="font-mono group-hover:text-white transition-colors">
              {formatMoveAmount(amount)} MOVE
            </span>
          ) : (
            <span className="text-muted-foreground group-hover:text-white/70 transition-colors">
              -
            </span>
          )}
          {gasUsed && gasUnitPrice && (
            <span className="text-xs text-muted-foreground group-hover:text-white/80 transition-colors">
              Gas {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
