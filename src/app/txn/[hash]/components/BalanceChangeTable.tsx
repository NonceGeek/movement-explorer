import {
  TableBody,
  TableCell,
  TableRow,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
  StyledTable as Table,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import type { BalanceChange } from "@/utils/transaction";
import { Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

interface BalanceChangeTableProps {
  changes: BalanceChange[];
}

export function BalanceChangeTable({ changes }: BalanceChangeTableProps) {
  if (!changes || changes.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-8 text-center text-muted-foreground">
          No balance changes found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <HeaderRow>
              <TableHead className="w-[30%]">Account</TableHead>
              <TableHead className="w-[15%]">Type</TableHead>
              <TableHead className="w-[20%]">Asset</TableHead>
              <TableHead className="w-[10%]">Verified</TableHead>
              <TableHead className="text-right w-[25%]">Change</TableHead>
            </HeaderRow>
          </TableHeader>
          <TableBody>
            {changes.map((change, i) => (
              <TableRow key={i}>
                <TableCell>
                  <CopyableAddress
                    address={change.address}
                    href={`/account/${change.address}`}
                    truncateLength={{ start: 6, end: 4 }}
                  />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      change.type === "Deposit"
                        ? "success"
                        : change.type === "Withdraw"
                          ? "secondary" // "secondary" often used for withdraw/negative or neutral
                          : change.type === "Gas Fee"
                            ? "warning"
                            : change.type === "Storage Refund"
                              ? "success"
                              : "outline"
                    }
                    className="font-medium whitespace-nowrap"
                  >
                    {change.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* Placeholder for Logo if we had one */}
                    <div className="flex flex-col">
                      <span
                        className="font-medium text-sm truncate max-w-[150px]"
                        title={change.asset.symbol}
                      >
                        {/* TODO: Add logic to display panora symbol or bridge info */}
                        {change.asset.symbol}
                      </span>
                      <span
                        className="text-xs text-muted-foreground truncate max-w-[150px]"
                        title={change.asset.id}
                      >
                        {change.asset.id.split("::").length > 1
                          ? change.asset.id.split("::")[1]
                          : "FA"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {/* Verification Badge Placeholder */}
                  {change.known && (
                    <Badge
                      variant="outline"
                      className="text-xs h-5 px-1 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Verified
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  <AmountCell change={change} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AmountCell({ change }: { change: BalanceChange }) {
  const isNegative =
    change.amount < 0 ||
    change.type === "Gas Fee" ||
    (change.type === "Withdraw" && change.amount > 0);
  // Note: change.amount for Withdraw is usually stored as negative in existing getBalanceChanges, but logic might vary.
  // In our getBalanceChanges, Withdraw puts negative amount.
  // For Gas Fee from GraphQL, amount is positive but represents cost.

  // Actually, let's look at getBalanceChanges: it sets negative amount for Withdraw.
  // So we just check amount < 0.
  // But for Gas Fee which we implement next, we should decide if we store it as negative or positive.
  // Usually fees are negative changes to balance.

  const amount = change.amount;
  const isDecrease = amount < 0;
  // If amount is negative, we show -abs(amount).

  const absAmount = amount < 0 ? -amount : amount;

  const formattedAmount = (
    Number(absAmount) / Math.pow(10, change.asset.decimals)
  ).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: change.asset.decimals,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${isDecrease ? "-" : "+"}${formattedAmount}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-center justify-end gap-1 cursor-pointer group ${isDecrease ? "text-destructive" : "text-green-600"}`}
      onClick={handleCopy}
    >
      <span>
        {isDecrease ? "-" : "+"}
        {formattedAmount}
      </span>
      <span className="text-xs ml-1 text-muted-foreground/70">
        {change.asset.symbol}
      </span>
      <TooltipProvider>
        <Tooltip open={copied}>
          <TooltipTrigger asChild>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Copy size={12} className="text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copied!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
