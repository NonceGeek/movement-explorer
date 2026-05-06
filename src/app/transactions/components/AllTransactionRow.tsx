import { Types } from "aptos";
import { motion, AnimatePresence } from "framer-motion";

import { FileText, ArrowRight, CircleCheckBig, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StyledTableRow, TableCell } from "@/components/ui/table";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { formatAge, formatDateTimeUTC } from "@/utils/time";
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
import Link from "next/link";
import { TransactionFunction } from "@/components/common/TransactionFunction";
import { TimestampToggle } from "@/components/common/TimestampToggle";

export function AllTransactionRow({
  transaction,
  timestampMode = "age",
  onToggleTimestampMode,
  className,
}: {
  transaction: Types.Transaction;
  timestampMode?: "age" | "dateTime";
  onToggleTimestampMode?: () => void;
  className?: string;
}) {
  const status = "success" in transaction ? transaction.success : true;
  const sender = getTransactionSender(transaction);
  const version = "version" in transaction ? transaction.version : null;
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

  return (
    <StyledTableRow className={cn(className)}>
      {/* Version + Status Icon */}
      <TableCell>
        <div className="flex items-center gap-2">
          {transaction.hash ? (
            <CopyableAddress
              address={transaction.hash}
              href={`/txn/${transaction.hash}`}
              className="text-primary font-mono transition-colors"
              truncateLength={{ start: 10, end: 0 }}
              icon={
                status ? (
                  <CircleCheckBig className="h-4 w-4 text-(--ms-good) shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )
              }
            />
          ) : (
            <Link
              href={`/txn/${version}`}
              className="text-primary font-mono transition-colors"
            >
              {version}
            </Link>
          )}
        </div>
      </TableCell>
      {/* Type with Icon */}
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-muted-foreground transition-colors">
                {typeInfo.icon}
                <span className="text-xs font-medium capitalize">
                  {typeInfo.label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">{typeInfo.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      {/* Timestamp (Age/UTC) */}
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap min-w-[120px]">
        <TimestampToggle
          timestamp={timestamp}
          timestampMode={timestampMode}
          onToggle={onToggleTimestampMode}
        />
      </TableCell>
      {/* Sender */}
      <TableCell>
        {sender ? (
          <CopyableAddress address={sender} href={`/account/${sender}`} showLabel />
        ) : (
          <span className="text-muted-foreground transition-colors">-</span>
        )}
      </TableCell>
      {/* Receiver */}
      <TableCell className="hidden md:table-cell">
        {counterparty ? (
          <CopyableAddress
            address={counterparty.address}
            href={`/account/${counterparty.address}`}
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
      {/* Function */}
      <TableCell className="hidden sm:table-cell w-[300px]">
        {functionName ? (
          <TransactionFunction transaction={transaction} />
        ) : (
          <span className="text-muted-foreground transition-colors">-</span>
        )}
      </TableCell>
      {/* Amount */}
      <TableCell className="hidden lg:table-cell text-right">
        {amount !== undefined && amount > 0 ? (
          <span className="font-mono tabular-nums transition-colors">
            {formatMoveAmount(amount)} MOVE
          </span>
        ) : (
          <span className="text-muted-foreground transition-colors">-</span>
        )}
      </TableCell>
      {/* Gas */}
      <TableCell className="hidden lg:table-cell text-right">
        {gasUsed && gasUnitPrice ? (
          <span className="font-mono tabular-nums text-sm text-muted-foreground transition-colors">
            {formatMoveAmount(BigInt(gasUsed) * BigInt(gasUnitPrice))}
          </span>
        ) : (
          <span className="text-muted-foreground transition-colors">-</span>
        )}
      </TableCell>
    </StyledTableRow>
  );
}
