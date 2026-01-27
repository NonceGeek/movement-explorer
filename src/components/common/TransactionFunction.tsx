import Link from "next/link";
import { Types } from "aptos";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionFunctionProps {
  transaction: Types.Transaction;
  className?: string;
}

export function TransactionFunction({
  transaction,
  className,
}: TransactionFunctionProps) {
  if (!("payload" in transaction)) {
    return null;
  }

  if (transaction.payload.type === "script_payload") {
    return (
      <span className={cn("text-muted-foreground", className)}>Script</span>
    );
  }

  let functionFullStr: string;
  if (transaction.payload.type === "multisig_payload") {
    if (
      "transaction_payload" in transaction.payload &&
      transaction.payload.transaction_payload &&
      "function" in transaction.payload.transaction_payload
    ) {
      functionFullStr = transaction.payload.transaction_payload.function;
    } else {
      return (
        <span className={cn("text-muted-foreground", className)}>Multisig</span>
      );
    }
  } else if ("function" in transaction.payload) {
    functionFullStr = transaction.payload.function;
  } else {
    return null;
  }

  // Handle Coin Transfer special cases or just treat as normal function
  // The source implementation checks for coin transfer and renders "Coin Transfer"
  // but links to the actual function. I will replicate that behavior if desired,
  // or simply link to the function.
  // For now, I'll stick to linking to the function as it's more generic and
  // consistent with providing direct code access.

  // Extract address, module, and function name
  // Format: address::module::function
  const parts = functionFullStr.split("::");
  if (parts.length < 3) {
    // Fallback for unexpected formats
    return (
      <span className={cn("text-muted-foreground", className)}>
        {functionFullStr}
      </span>
    );
  }

  const [address, moduleName, functionName] = parts;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/account/${address}/modules/code/${moduleName}/${functionName}`}
            className={cn(
              "px-2 py-1 bg-muted rounded text-xs font-mono group-hover:bg-guild-green-500/20 group-hover:text-guild-green-500 transition-colors inline-block max-w-40 truncate align-middle",
              className,
            )}
          >
            {moduleName}::{functionName}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{functionFullStr}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
