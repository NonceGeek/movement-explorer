import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { BalanceChange } from "@/utils/transaction";

interface BalanceChangeTableProps {
  changes: BalanceChange[];
}

export function BalanceChangeTable({ changes }: BalanceChangeTableProps) {
  if (changes.length === 0) {
    return <p className="text-muted-foreground">No balance changes</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">
              Account
            </th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium">
              Type
            </th>
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">
              Amount (MOVE)
            </th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-3 px-4">
                <Link
                  href={`/account/${change.address}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {change.address.slice(0, 10)}...{change.address.slice(-8)}
                </Link>
              </td>
              <td className="py-3 px-4">
                <Badge
                  variant={change.type === "Deposit" ? "success" : "secondary"}
                  className="text-xs"
                >
                  {change.type}
                </Badge>
              </td>
              <td
                className={`py-3 px-4 text-right font-mono ${
                  change.amount >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {change.amount >= 0 ? "+" : ""}
                {(Number(change.amount) / 1e8).toFixed(8)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
