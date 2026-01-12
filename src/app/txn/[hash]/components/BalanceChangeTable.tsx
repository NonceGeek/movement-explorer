import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import type { BalanceChange } from "@/utils/transaction";

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
            <TableRow>
              <TableHead className="w-[40%]">Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount (MOVE)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.map((change, i) => (
              <TableRow key={i}>
                <TableCell>
                  <CopyableAddress
                    address={change.address}
                    href={`/account/${change.address}`}
                    truncateLength={{ start: 10, end: 8 }}
                  />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      change.type === "Deposit" ? "success" : "secondary"
                    }
                    className="font-medium"
                  >
                    {change.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  <span
                    className={
                      change.amount >= 0 ? "text-green-600" : "text-destructive"
                    }
                  >
                    {change.amount >= 0 ? "+" : ""}
                    {(Number(change.amount) / 1e8).toFixed(8)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
