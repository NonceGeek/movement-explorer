import Link from "next/link";
import { Hammer, Flame, ArrowRightLeft, RefreshCw } from "lucide-react";
import type { TransactionAction } from "@/utils/transaction";

interface ActionsDisplayProps {
  actions: TransactionAction[];
}

export function ActionsDisplay({ actions }: ActionsDisplayProps) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      {actions.map((action, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded"
        >
          {action.type === "nft_mint" && (
            <>
              <Hammer className="w-4 h-4 text-muted-foreground" />
              <span>Minted</span>
              <Link
                href={`/object/${action.token}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.token.slice(0, 10)}...
              </Link>
              <span>in</span>
              <Link
                href={`/object/${action.collection}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.collection.slice(0, 10)}...
              </Link>
            </>
          )}
          {action.type === "nft_burn" && (
            <>
              <Flame className="w-4 h-4 text-muted-foreground" />
              <span>Burned</span>
              <Link
                href={`/object/${action.token}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.token.slice(0, 10)}...
              </Link>
            </>
          )}
          {action.type === "object_transfer" && (
            <>
              <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
              <span>Transferred</span>
              <Link
                href={`/object/${action.object}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.object.slice(0, 10)}...
              </Link>
              <span>from</span>
              <Link
                href={`/account/${action.from}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.from.slice(0, 8)}...
              </Link>
              <span>to</span>
              <Link
                href={`/account/${action.to}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {action.to.slice(0, 8)}...
              </Link>
            </>
          )}
          {action.type === "swap" && (
            <>
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <span>Swapped</span>
              <span className="font-mono">{action.amountIn}</span>
              <span>for</span>
              <span className="font-mono">{action.amountOut}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
