"use client";

import { useRouter } from "next/navigation";
import { FileText, ArrowRight, CircleCheckBig, XCircle } from "lucide-react";
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
  getTransactionDirection,
  getTransactionToken,
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
      <TransactionTableRowCells
        transaction={props.transaction}
        version={props.version}
        columns={props.columns}
        timestampMode={props.timestampMode}
        onToggleTimestampMode={props.onToggleTimestampMode}
        address={props.address}
      />
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
  address,
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
          <TableCell key={column.key} className={widthClass}>
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
                address={transaction.hash || ""}
                href={`/txn/${transaction.hash || version}`}
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
        );

      case "timestamp":
        return (
          <TableCell
            key={column.key}
            className={cn("text-foreground/80 text-sm whitespace-nowrap", widthClass)}
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
          <TableCell key={column.key} className={widthClass}>
            {sender ? (
              <CopyableAddress address={sender} href={`/account/${sender}`} className="text-primary" showLabel />
            ) : (
              <span className="text-muted-foreground transition-colors">-</span>
            )}
          </TableCell>
        );

      case "direction": {
        if (!address) {
          return <TableCell key={column.key} className={widthClass} />;
        }
        const direction = getTransactionDirection(transaction, address);
        const directionConfig = {
          out: {
            label: "OUT",
            tooltip: "Sent a transfer",
            className:
              "bg-oracle-orange-500/15 text-oracle-orange-500 border-oracle-orange-500/30",
          },
          in: {
            label: "IN",
            tooltip: "Received a transfer",
            className:
              "bg-guild-green-500/15 text-guild-green-500 border-guild-green-500/30",
          },
          self: {
            label: "SELF",
            tooltip: "Transferred to self",
            className:
              "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
          },
          call: {
            label: "CALL",
            tooltip: "Initiated a contract call",
            className:
              "bg-blue-500/15 text-blue-500 border-blue-500/30",
          },
          related: {
            label: "RELATED",
            tooltip: "Indirectly involved",
            className:
              "bg-muted text-muted-foreground border-border",
          },
        } as const;
        const config = directionConfig[direction];
        return (
          <TableCell key={column.key} className={widthClass}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border cursor-default",
                      config.className,
                    )}
                  >
                    {config.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{config.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>
        );
      }

      case "to":
        return (
          <TableCell key={column.key} className={cn(hideClass, widthClass)}>
            {counterparty ? (
              <CopyableAddress
                address={counterparty.address}
                href={`/account/${counterparty.address}`}
                className="text-primary"
                showLabel
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
          <TableCell key={column.key} className={cn(hideClass, alignClass, widthClass)}>
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
          <TableCell key={column.key} className={cn(hideClass, alignClass, widthClass)}>
            {gasUsed && gasUnitPrice ? (
              <span className="font-mono text-sm text-foreground/70 transition-colors">
                {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
              </span>
            ) : (
              <span className="text-muted-foreground transition-colors">-</span>
            )}
          </TableCell>
        );

      case "token": {
        const tokenName = getTransactionToken(transaction);
        return (
          <TableCell key={column.key} className={cn(hideClass, widthClass)}>
            {tokenName ? (
              <span className="text-sm text-foreground/80 transition-colors truncate max-w-[130px] inline-block">
                {tokenName}
              </span>
            ) : (
              <span className="text-muted-foreground transition-colors">-</span>
            )}
          </TableCell>
        );
      }

      default:
        return null;
    }
  };

  return <>{columns.map((column) => renderCell(column))}</>;
}
