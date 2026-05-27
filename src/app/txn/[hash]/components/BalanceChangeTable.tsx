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
import { AssetCell } from "@/components/common/AssetCell";
import { VerificationCell } from "@/components/common/VerificationCell";
import type { BalanceChange } from "@/utils/transaction";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatMovementPath } from "@/utils";
import { formatUSDValue } from "@/utils/formatters";

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
    <Table>
      <TableHeader>
        <HeaderRow>
          <TableHead className="w-[20%]">Account</TableHead>
          <TableHead className="w-[10%]">Type</TableHead>
          <TableHead className="w-[15%]">Asset</TableHead>
          <TableHead className="w-[20%]">Asset Address</TableHead>
          <TableHead className="w-[10%]">Verified</TableHead>
          <TableHead className="text-right w-[25%]">Change</TableHead>
        </HeaderRow>
      </TableHeader>
      <TableBody>
        {changes.map((change, i) => {
          const isCoin = change.asset.id.includes("::");
          const assetHref = isCoin
            ? `/coin/${formatMovementPath(change.asset.id)}`
            : `/fa/${change.asset.id}`;

          return (
            <TableRow key={i}>
              {/* Account Cell */}
              <TableCell>
                <CopyableAddress
                  address={change.address}
                  href={`/account/${change.address}`}
                  truncateLength={{ start: 6, end: 4 }}
                />
              </TableCell>

              {/* Type Cell */}
              <TableCell>
                <Badge
                  variant={
                    change.type === "Deposit"
                      ? "success"
                      : change.type === "Withdraw"
                        ? "secondary"
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

              {/* Asset Cell - Using AssetCell component */}
              <TableCell>
                <AssetCell
                  assetId={change.asset.id}
                  symbol={change.asset.symbol}
                  logoUrl={change.logoUrl}
                />
              </TableCell>

              {/* Asset Address Cell - Using CopyableAddress without copy */}
              <TableCell>
                <CopyableAddress
                  address={change.asset.id}
                  href={assetHref}
                  showCopyButton={false}
                  truncateLength={{ start: 6, end: 4 }}
                  showFull={change.asset.id.length <= 30}
                  variant="default"
                />
              </TableCell>

              {/* Verification Cell - Using VerificationCell component */}
              <TableCell>
                <VerificationCell
                  assetId={change.asset.id}
                  known={change.known}
                  symbol={change.asset.symbol}
                  isBanned={change.isBanned}
                  isInPanoraTokenList={change.isInPanoraTokenList}
                  panoraTags={change.panoraTags}
                />
              </TableCell>

              {/* Amount Cell */}
              <TableCell className="text-right font-mono text-sm">
                <AmountCell change={change} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function AmountCell({ change }: { change: BalanceChange }) {
  const amount = change.amount;
  const isDecrease = amount < 0;
  const absAmount = amount < 0 ? -amount : amount;
  const usdValue = formatUSDValue(
    absAmount,
    change.asset.decimals,
    change.usdPrice ?? null,
  );

  const formattedAmount = (
    Number(absAmount) / Math.pow(10, change.asset.decimals)
  ).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: change.asset.decimals,
  });

  const formattedCurrentPrice = change.usdPrice
    ? change.usdPrice.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: change.usdPrice < 1 ? 4 : 2,
        maximumFractionDigits: change.usdPrice < 1 ? 8 : 2,
      })
    : null;

  const amountContent = (
    <div
      className={`flex items-center justify-end gap-1 ${isDecrease ? "text-destructive" : "text-green-600"}`}
    >
      <span>
        {isDecrease ? "-" : "+"}
        {formattedAmount}
      </span>
      <span className="text-xs ml-1 text-muted-foreground/70">
        {change.asset.symbol}
      </span>
      {usdValue && (
        <span className="text-muted-foreground ml-1">({usdValue})</span>
      )}
    </div>
  );

  if (formattedCurrentPrice) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="ml-auto w-fit">{amountContent}</div>
          </TooltipTrigger>
          <TooltipContent side="top">
            Current Price: {formattedCurrentPrice} / {change.asset.symbol}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={`flex items-center justify-end gap-1 ${isDecrease ? "text-destructive" : "text-green-600"}`}
    >
      <span>
        {isDecrease ? "-" : "+"}
        {formattedAmount}
      </span>
      <span className="text-xs ml-1 text-muted-foreground/70">
        {change.asset.symbol}
      </span>
    </div>
  );
}
