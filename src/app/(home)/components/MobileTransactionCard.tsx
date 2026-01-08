"use client";

import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileText,
  User,
} from "lucide-react";
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
import { Types } from "aptos";

export interface MobileTransactionCardProps {
  version: number;
  transactionData: Types.Transaction;
  timestampMode?: "age" | "dateTime";
  className?: string;
}

export function MobileTransactionCard({
  version,
  transactionData,
  timestampMode = "age",
  className,
}: MobileTransactionCardProps) {
  const transaction = transactionData;

  const status = "success" in transaction ? transaction.success : true;
  const sender = getTransactionSender(transaction);
  const timestamp = "timestamp" in transaction ? transaction.timestamp : null;
  const counterparty = getTransactionCounterparty(transaction);
  const amount = getTransactionAmount(transaction);
  const functionName = getTransactionFunction(transaction);
  const gasUsed = "gas_used" in transaction ? transaction.gas_used : null;
  const gasUnitPrice =
    "gas_unit_price" in transaction ? transaction.gas_unit_price : null;

  // Truncate function name for mobile display
  const displayFunctionName = functionName
    ? functionName.length > 25
      ? functionName.slice(0, 22) + "..."
      : functionName
    : null;

  return (
    <Link
      href={`/txn/${version}`}
      className={cn(
        "block bg-card/50 backdrop-blur-sm rounded-lg border border-border/50",
        "p-3 sm:p-4",
        "transition-all active:scale-[0.98] hover:bg-card/80 hover:border-primary/30 hover:shadow-md",
        className
      )}
    >
      {/* Header: Version + Status + Timestamp */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {status ? (
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-guild-green-500 shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-oracle-orange-500 shrink-0" />
          )}
          <span className="font-mono text-primary font-medium text-sm sm:text-base">
            {version}
          </span>
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {timestamp
            ? timestampMode === "age"
              ? formatAge(timestamp)
              : formatDateTimeUTC(timestamp)
            : "-"}
        </span>
      </div>

      {/* Sender & Receiver */}
      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground w-12 sm:w-16 shrink-0">
            From
          </span>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
            {sender ? (
              <CopyableAddress
                address={sender}
                href={`/account/${sender}`}
                className="text-xs sm:text-sm"
              />
            ) : (
              <span className="text-muted-foreground text-xs">-</span>
            )}
          </div>
        </div>
        {counterparty && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-muted-foreground w-12 sm:w-16 shrink-0">
              {counterparty.role === "smartContract" ? "Contract" : "To"}
            </span>
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {counterparty.role === "smartContract" ? (
                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
              )}
              <CopyableAddress
                address={counterparty.address}
                href={`/account/${counterparty.address}`}
                className="text-xs sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer: Function + Amount + Gas */}
      <div className="flex items-start justify-between gap-2">
        {displayFunctionName && (
          <code className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted rounded text-[10px] sm:text-xs font-mono truncate max-w-[45%]">
            {displayFunctionName}
          </code>
        )}
        <div className="flex flex-col items-end gap-0.5 sm:gap-1 ml-auto shrink-0">
          {amount !== undefined && amount > 0 && (
            <span className="font-mono text-xs sm:text-sm">
              {formatMoveAmount(amount)}{" "}
              <span className="text-muted-foreground">MOVE</span>
            </span>
          )}
          {gasUsed && gasUnitPrice && (
            <span className="font-mono text-[10px] sm:text-xs text-muted-foreground">
              Gas: {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
