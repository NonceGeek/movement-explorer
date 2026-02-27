"use client";

import Link from "next/link";
import { Types } from "aptos";
import { FileCheck } from "lucide-react";
import { cn } from "@/utils/styling";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useContractSourceAvailability } from "@/hooks/accounts/useContractSourceAvailability";
import { formatMovementPath } from "@/utils";
import { getFunctionDescription } from "@/constants/contractFunctions";

interface TransactionFunctionProps {
  transaction: Types.Transaction;
  className?: string;
}

export function TransactionFunction({
  transaction,
  className,
}: TransactionFunctionProps) {
  if (!("payload" in transaction)) {
    return "-";
  }

  if (transaction.payload.type === "script_payload") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-md bg-muted/50 text-xs font-mono text-muted-foreground",
          className,
        )}
      >
        Script
      </span>
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
        <span
          className={cn(
            "inline-flex items-center px-2 py-1 rounded-md bg-muted/50 text-xs font-mono text-muted-foreground",
            className,
          )}
        >
          Multisig
        </span>
      );
    }
  } else if ("function" in transaction.payload) {
    functionFullStr = transaction.payload.function;
  } else {
    return "-";
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
    <TransactionFunctionWithSource
      address={address}
      moduleName={moduleName}
      functionName={functionName}
      functionFullStr={functionFullStr}
      className={className}
    />
  );
}

function TransactionFunctionWithSource({
  address,
  moduleName,
  functionName,
  functionFullStr,
  className,
}: {
  address: string;
  moduleName: string;
  functionName: string;
  functionFullStr: string;
  className?: string;
}) {
  const { hasSource } = useContractSourceAvailability(address);
  const description = getFunctionDescription(functionFullStr);
  const displayName = description ?? functionName;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/account/${address}/modules/write/${moduleName}/${functionName}`}
            className={cn(
              "inline-flex items-center gap-1 py-0.5 h-[30px] rounded-md transition-all duration-200",
              description ? "text-sm text-primary" : "font-mono text-sm text-primary",
              "hover:bg-primary/10",
              "max-w-[180px]",
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {hasSource && (
              <FileCheck className="size-[16] text-white fill-blue-500 shrink-0" />
            )}
            <span className="truncate">{displayName}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="p-3 max-w-80 sm:max-w-100">
          <div className="flex flex-col gap-3 [&_span]:!block [&_svg]:!block">
            <div className="space-y-1">
              <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                Address
              </span>
              <div className="font-mono text-xs text-white break-all bg-muted/30 p-2 rounded border border-border/50 leading-relaxed">
                {address}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                  Module
                </span>
                <div className="font-mono text-xs text-foreground bg-muted/30 p-2 rounded border border-border/50 break-all whitespace-pre-wrap">
                  {formatMovementPath(moduleName)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                  Function
                </span>
                <div className="font-mono text-xs text-guild-green-500 font-medium bg-primary/5 p-2 rounded border border-primary/10 break-all whitespace-pre-wrap">
                  {functionName}
                </div>
              </div>
            </div>

            {hasSource && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-blue-500/15 border border-blue-500/20 text-white">
                <FileCheck size={20} className="text-white fill-blue-500 shrink-0" />
                <span className="text-xs">This contract is open source and the source code is available for viewing.</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
