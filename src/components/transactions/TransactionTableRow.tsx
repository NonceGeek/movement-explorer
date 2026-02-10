"use client";

import { useRouter } from "next/navigation";
import { FileText, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StyledTableRow, TableCell } from "@/components/ui/table";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { TimestampToggle } from "@/components/common/TimestampToggle";
import { TransactionFunction } from "@/components/common/TransactionFunction";
import { cn } from "@/utils/styling";
import {
  getTransactionSender,
  getTransactionCounterparty,
  getTransactionAmount,
  getTransactionFunction,
  formatMoveAmount,
} from "@/utils/transaction";
import {
  TransactionTypeName,
  TRANSACTION_TYPE_INFO,
} from "@/constants/transaction";
import { TransactionTableRowProps, TransactionColumnConfig } from "./types";

/**
 * Unified transaction table row component
 * Renders cells based on column configuration
 */
export function TransactionTableRow({
  className,
  ...props
}: TransactionTableRowProps) {
  const router = useRouter();
  const txHash = props.transaction.hash || props.version;

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, [role="button"]')) return;
    router.push(`/txn/${txHash}`);
  };

  return (
    <StyledTableRow
      className={cn("cursor-pointer", className)}
      onClick={handleRowClick}
    >
      <TransactionTableRowCells {...props} />
    </StyledTableRow>
  );
}

/**
 * Transaction table row cells only (without wrapper)
 * Used for custom animation wrappers like motion.tr
 */
export function TransactionTableRowCells({
  transaction,
  version,
  columns,
  timestampMode,
  onToggleTimestampMode,
}: Omit<TransactionTableRowProps, "className" | "isHighlighted">) {
  // Extract transaction data
  const status = "success" in transaction ? transaction.success : true;
  const sender = getTransactionSender(transaction);
  const timestamp = "timestamp" in transaction ? transaction.timestamp : null;
  const counterparty = getTransactionCounterparty(transaction);
  const amount = getTransactionAmount(transaction);
  const functionName = getTransactionFunction(transaction);
  const gasUsed = "gas_used" in transaction ? transaction.gas_used : null;
  const gasUnitPrice =
    "gas_unit_price" in transaction ? transaction.gas_unit_price : null;
  const txType = transaction.type as TransactionTypeName;
  const typeInfo =
    TRANSACTION_TYPE_INFO[txType] ??
    TRANSACTION_TYPE_INFO[TransactionTypeName.Unknown];

  // Get responsive class for column hiding
  const getHideClass = (hideAt?: "sm" | "md" | "lg") => {
    if (!hideAt) return "";
    return `hidden ${hideAt}:table-cell`;
  };

  // Render individual cell based on column key
  const renderCell = (column: TransactionColumnConfig) => {
    const hideClass = getHideClass(column.hideAt);
    const alignClass = column.align === "right" ? "text-right" : "";
    const justifyClass =
      column.align === "right"
        ? "justify-end"
        : column.align === "center"
          ? "justify-center"
          : "justify-start";
    const widthClass = column.width || "";

    switch (column.key) {
      case "hash":
        return (
          <TableCell key={column.key}>
            <div className="flex items-center gap-2">
              <CopyableAddress
                address={transaction.hash || ""}
                href={`/txn/${transaction.hash || version}`}
                className="text-primary font-mono transition-colors"
                truncateLength={{ start: 10, end: 0 }}
                icon={
                  status ? (
                    <CheckCircle2 className="h-4 w-4 text-guild-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-oracle-orange-500 shrink-0" />
                  )
                }
              />
            </div>
          </TableCell>
        );

      case "type":
        return (
          <TableCell key={column.key} className={cn(hideClass, alignClass)}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center text-muted-foreground transition-colors cursor-default",
                      justifyClass,
                    )}
                  >
                    {typeInfo.icon}
                  </div>
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
          </TableCell>
        );

      case "timestamp":
        return (
          <TableCell
            key={column.key}
            className="text-muted-foreground text-sm whitespace-nowrap min-w-[120px]"
          >
            <TimestampToggle
              timestamp={timestamp}
              timestampMode={timestampMode}
              onToggle={onToggleTimestampMode}
            />
          </TableCell>
        );

      case "sender":
        return (
          <TableCell key={column.key}>
            {sender ? (
              <CopyableAddress address={sender} href={`/account/${sender}`} />
            ) : (
              <span className="text-muted-foreground transition-colors">-</span>
            )}
          </TableCell>
        );

      case "to":
        return (
          <TableCell key={column.key} className={cn(hideClass)}>
            {counterparty ? (
              <CopyableAddress
                address={counterparty.address}
                href={`/account/${counterparty.address}`}
                icon={
                  counterparty.role === "smartContract" ? (
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  )
                }
              />
            ) : (
              <span className="text-muted-foreground transition-colors">-</span>
            )}
          </TableCell>
        );

      case "function":
        return (
          <TableCell key={column.key} className={cn(hideClass, widthClass)}>
            {functionName ? (
              <TransactionFunction transaction={transaction} />
            ) : (
              <span className="text-muted-foreground transition-colors">-</span>
            )}
          </TableCell>
        );

      case "amount":
        return (
          <TableCell key={column.key} className={cn(hideClass, alignClass)}>
            {amount !== undefined && amount > 0 ? (
              <span className="font-mono transition-colors">
                {formatMoveAmount(amount)} MOVE
              </span>
            ) : (
              <span className="text-muted-foreground transition-colors">-</span>
            )}
          </TableCell>
        );

      case "gas":
        return (
          <TableCell key={column.key} className={cn(hideClass, alignClass)}>
            {gasUsed && gasUnitPrice ? (
              <span className="font-mono text-sm text-muted-foreground transition-colors">
                {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
              </span>
            ) : (
              <span className="text-muted-foreground transition-colors">-</span>
            )}
          </TableCell>
        );

      default:
        return null;
    }
  };

  return <>{columns.map((column) => renderCell(column))}</>;
}
