import { Types } from "aptos";
import { FileText, ArrowRight, CircleCheckBig, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { StyledTableRow, TableCell, TableRow } from "@/components/ui/table";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { TimestampToggle } from "@/components/common/TimestampToggle";
import { cn } from "@/utils/styling";
import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";
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
import { TransactionFunction } from "@/components/common/TransactionFunction";

export function UserTransactionRow({
  version,
  timestampMode = "age",
  onToggleTimestampMode,
  className,
}: {
  version: number;
  timestampMode?: "age" | "dateTime";
  onToggleTimestampMode?: () => void;
  className?: string;
}) {
  const {
    data: transaction,
    isError,
    isLoading,
  } = useGetTransaction(version.toString());

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={8}>
          <EnhancedSkeleton className="h-8 w-full" />
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
  const txType = transaction.type as TransactionTypeName;
  const typeInfo =
    TRANSACTION_TYPE_INFO[txType] ??
    TRANSACTION_TYPE_INFO[TransactionTypeName.Unknown];

  return (
    <StyledTableRow className={cn(className)}>
      {/* Transaction Hash + Status Icon */}
      <TableCell>
        <div className="flex items-center gap-2">
          {status ? (
            <CircleCheckBig className="h-4 w-4 text-guild-green-500 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-oracle-orange-500 shrink-0" />
          )}
          {transaction.hash ? (
            <CopyableAddress
              address={transaction.hash}
              href={`/txn/${transaction.hash}`}
              className="text-primary hover:underline font-mono transition-colors"
              truncateLength={{ start: 6, end: 6 }}
            />
          ) : (
            <span>-</span>
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
      <TableCell className="text-muted-foreground text-sm transition-colors whitespace-nowrap">
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
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {counterparty.role === "smartContract" ? (
                    <FileText className="h-4 w-4 text-muted-foreground transition-colors" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors" />
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
              showLabel
            />
          </div>
        ) : (
          <span className="text-muted-foreground transition-colors">-</span>
        )}
      </TableCell>
      {/* Function */}
      <TableCell className="hidden sm:table-cell">
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
