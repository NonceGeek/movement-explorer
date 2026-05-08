"use client";

import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  FileCheck,
  FileText,
  User,
} from "lucide-react";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { cn } from "@/utils/styling";
import {
  getTransactionSender,
  getTransactionCounterparty,
  getTransactionAmount,
  getTransactionFunction,
  getTransactionModuleAddress,
  formatMoveAmount,
} from "@/utils/transaction";
import { formatAge, formatDateTimeUTC } from "@/utils/time";
import { useContractSourceAvailability } from "@/hooks/accounts/useContractSourceAvailability";
import { getFunctionDescription } from "@/constants/contractFunctions";
import { Types } from "aptos";

export interface MobileTransactionCardProps {
  version: number;
  transactionData: Types.Transaction;
  timestampMode?: "age" | "dateTime";
  className?: string;
}

/**
 * MobileTransactionCardContent - Returns the card content without Link wrapper
 * Used by parent components that need to wrap with motion.div for animations
 */
/**
 * Extract the full function string (address::module::function) from transaction payload
 */
function getFullFunctionStr(transaction: Types.Transaction): string | null {
  if (!("payload" in transaction)) return null;
  if (transaction.payload.type === "script_payload") return null;
  if (transaction.payload.type === "multisig_payload") {
    if (
      "transaction_payload" in transaction.payload &&
      transaction.payload.transaction_payload &&
      "function" in transaction.payload.transaction_payload
    ) {
      return transaction.payload.transaction_payload.function;
    }
    return null;
  }
  if ("function" in transaction.payload) {
    return transaction.payload.function;
  }
  return null;
}

/**
 * Extract method name from function string
 * getTransactionFunction returns formats like:
 * - "module::function" (e.g., "router::swap")
 * - "Script"
 * - "Multisig"
 * - "Coin Transfer"
 * We want to extract only the function name (last part after ::)
 */
function getMethodName(functionStr: string | null): string | null {
  if (!functionStr) return null;
  // If it contains "::", split and get the last part (function name)
  if (functionStr.includes("::")) {
    const parts = functionStr.split("::");
    return parts[parts.length - 1];
  }
  // Otherwise return as-is (e.g., "Script", "Multisig", "Coin Transfer")
  return functionStr;
}

export function MobileTransactionCardContent({
  version,
  transactionData,
  timestampMode = "age",
}: Omit<MobileTransactionCardProps, "className">) {
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

  // Extract only the method name from full function path (like PC version)
  const methodName = getMethodName(functionName);
  const moduleAddress = getTransactionModuleAddress(transaction);
  const { hasSource } = useContractSourceAvailability(moduleAddress);

  // Check for human-friendly function description
  const fullFunctionStr = getFullFunctionStr(transaction);
  const functionDescription = fullFunctionStr
    ? getFunctionDescription(fullFunctionStr)
    : null;

  return (
    <>
      {/* Header: Version + Status + Timestamp */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {status ? (
            <CheckCircle2 className="h-4 w-4 text-(--ms-good) shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
          <span className="font-mono text-primary font-semibold text-base">
            {version}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {timestamp
            ? timestampMode === "age"
              ? formatAge(timestamp)
              : formatDateTimeUTC(timestamp)
            : "-"}
        </span>
      </div>

      {/* Sender & To */}
      <div className="space-y-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground w-14 shrink-0">
            From
          </span>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {sender ? (
              <CopyableAddress
                address={sender}
                href={`/account/${sender}`}
                className="text-sm"
                showLabel
              />
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </div>
        </div>
        {counterparty && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-14 shrink-0">
              {counterparty.role === "smartContract" ? "Contract" : "To"}
            </span>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {counterparty.role === "smartContract" ? (
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <CopyableAddress
                address={counterparty.address}
                href={`/account/${counterparty.address}`}
                className="text-sm"
                showLabel
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer: Function + Amount + Gas */}
      <div className="flex items-start justify-between gap-3">
        {(functionDescription || methodName) && (
          <code
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs break-all leading-relaxed",
              functionDescription
                ? "bg-primary/15 text-primary font-medium"
                : "bg-muted/80 font-mono text-primary",
            )}
          >
            {hasSource && (
              <FileCheck className="h-3 w-3 text-white fill-blue-500 shrink-0" />
            )}
            {functionDescription ?? methodName}
          </code>
        )}
        <div className="flex flex-col items-end gap-1 ml-auto shrink-0">
          {amount !== undefined && amount > 0 && (
            <span className="font-mono text-sm font-medium">
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
    </>
  );
}

/**
 * MobileTransactionCard - Full card component with Link wrapper (backward compatible)
 */
export function MobileTransactionCard({
  version,
  transactionData,
  timestampMode = "age",
  className,
}: MobileTransactionCardProps) {
  return (
    <Link
      href={`/txn/${version}`}
      className={cn(
        "block bg-card backdrop-blur-sm rounded-lg border border-border/50",
        "p-3 sm:p-4",
        "transition-all active:scale-[0.98] hover:bg-card hover:border-primary/30 hover:shadow-md",
        className
      )}
    >
      <MobileTransactionCardContent
        version={version}
        transactionData={transactionData}
        timestampMode={timestampMode}
      />
    </Link>
  );
}
