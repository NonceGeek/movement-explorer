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

  return (
    <Link
      href={`/txn/${version}`}
      className={cn(
        "block bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 p-4 transition-all hover:bg-card/80 hover:border-primary/30 hover:shadow-md",
        className
      )}
    >
      {/* Header: Version + Status + Timestamp */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {status ? (
            <CheckCircle2 className="h-4 w-4 text-guild-green-500 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-oracle-orange-500 shrink-0" />
          )}
          <span className="font-mono text-primary font-medium">{version}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {timestamp
            ? timestampMode === "age"
              ? formatAge(timestamp)
              : formatDateTimeUTC(timestamp)
            : "-"}
        </span>
      </div>

      {/* Sender & Receiver */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 shrink-0">
            From
          </span>
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {sender ? (
              <CopyableAddress address={sender} href={`/account/${sender}`} />
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        </div>
        {counterparty && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0">
              {counterparty.role === "smartContract" ? "Contract" : "To"}
            </span>
            <div className="flex items-center gap-1">
              {counterparty.role === "smartContract" ? (
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <CopyableAddress
                address={counterparty.address}
                href={`/account/${counterparty.address}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer: Function + Amount + Gas */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        {functionName && (
          <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
            {functionName}
          </code>
        )}
        <div className="flex flex-col items-end gap-1 ml-auto">
          {amount !== undefined && amount > 0 && (
            <span className="font-mono text-sm">
              {formatMoveAmount(amount)}{" "}
              <span className="text-muted-foreground">MOVE</span>
            </span>
          )}
          {gasUsed && gasUnitPrice && (
            <span className="font-mono text-xs text-muted-foreground">
              Gas: {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
