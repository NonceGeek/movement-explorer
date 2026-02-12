"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import JsonViewer from "@/components/ui/json-viewer";
import { cn } from "@/utils/styling";
import { Code2, FileJson, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import type { Types } from "aptos";

interface PayloadDecoderProps {
  payload: Types.TransactionPayload | null;
  className?: string;
}

interface DecodedArgument {
  index: number;
  name: string;
  type: string;
  value: unknown;
  displayValue: string;
}

// Known function signatures for better decoding
const KNOWN_FUNCTIONS: Record<
  string,
  { args: Array<{ name: string; type: string }> }
> = {
  "0x1::coin::transfer": {
    args: [
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::aptos_account::transfer": {
    args: [
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::aptos_account::transfer_coins": {
    args: [
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::primary_fungible_store::transfer": {
    args: [
      { name: "metadata", type: "Object<Metadata>" },
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::object::transfer": {
    args: [
      { name: "object", type: "Object<T>" },
      { name: "to", type: "address" },
    ],
  },
  "0x1::delegation_pool::add_stake": {
    args: [
      { name: "pool_address", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::delegation_pool::unlock": {
    args: [
      { name: "pool_address", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::delegation_pool::withdraw": {
    args: [
      { name: "pool_address", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::managed_coin::register": {
    args: [],
  },
  "0x1::code::publish_package_txn": {
    args: [
      { name: "metadata_serialized", type: "vector<u8>" },
      { name: "code", type: "vector<vector<u8>>" },
    ],
  },
};

function decodeArguments(
  func: string,
  args: unknown[],
  _typeArgs: string[]
): DecodedArgument[] {
  const known = KNOWN_FUNCTIONS[func];
  const decoded: DecodedArgument[] = [];

  args.forEach((arg, index) => {
    const argInfo = known?.args[index];
    const name = argInfo?.name || `arg_${index}`;
    const type = argInfo?.type || inferType(arg);
    const displayValue = formatArgValue(arg, type);

    decoded.push({
      index,
      name,
      type,
      value: arg,
      displayValue,
    });
  });

  return decoded;
}

function inferType(value: unknown): string {
  if (typeof value === "string") {
    if (value.startsWith("0x") && value.length === 66) return "address";
    if (value.startsWith("0x")) return "hex";
    if (/^\d+$/.test(value)) return "u64";
    return "string";
  }
  if (typeof value === "number") return "u64";
  if (typeof value === "boolean") return "bool";
  if (Array.isArray(value)) return "vector";
  return "unknown";
}

function formatArgValue(value: unknown, type: string): string {
  if (type === "address" && typeof value === "string") {
    return value;
  }
  if (type === "u64" && typeof value === "string") {
    // Format large numbers with commas
    return BigInt(value).toLocaleString();
  }
  if (type === "vector<u8>" && typeof value === "string") {
    // Hex encoded bytes
    return `${value.slice(0, 20)}...`;
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  return String(value);
}

export function PayloadDecoder({ payload, className }: PayloadDecoderProps) {
  const [viewMode, setViewMode] = useState<"decoded" | "raw">("decoded");
  const [showTypeArgs, setShowTypeArgs] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!payload) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No payload data available
      </div>
    );
  }

  const isEntryFunction = payload.type === "entry_function_payload";
  const isScript = payload.type === "script_payload";
  const isMultisig = payload.type === "multisig_payload";

  const entryPayload = isEntryFunction
    ? (payload as Types.TransactionPayload_EntryFunctionPayload)
    : isMultisig &&
        "transaction_payload" in payload &&
        payload.transaction_payload
      ? (payload.transaction_payload as Types.TransactionPayload_EntryFunctionPayload)
      : null;

  const func = entryPayload?.function || "";
  const args = entryPayload?.arguments || [];
  const typeArgs = entryPayload?.type_arguments || [];
  const decodedArgs = entryPayload ? decodeArguments(func, args, typeArgs) : [];

  const funcParts = func.split("::");
  const moduleAddr = funcParts[0] || "";
  const moduleName = funcParts[1] || "";
  const funcName = funcParts[2] || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "decoded" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("decoded")}
            className="gap-2"
          >
            <Code2 className="h-4 w-4" />
            Decoded
          </Button>
          <Button
            variant={viewMode === "raw" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("raw")}
            className="gap-2"
          >
            <FileJson className="h-4 w-4" />
            Raw
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {viewMode === "raw" ? (
        <JsonViewer data={payload} initialDepth={2} />
      ) : (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
          {/* Payload Type */}
          <div className="px-5 py-3 border-b border-border/30 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Badge variant="secondary" className="capitalize">
              {payload.type.replace(/_/g, " ")}
            </Badge>
            {isMultisig && (
              <Badge variant="outline" className="text-orange-500">
                Multisig
              </Badge>
            )}
          </div>

          {isScript && (
            <div className="px-5 py-4">
              <div className="text-sm text-muted-foreground mb-2">Script Payload</div>
              <JsonViewer data={payload} initialDepth={1} />
            </div>
          )}

          {entryPayload && (
            <>
              {/* Function */}
              <div className="px-5 py-3 border-b border-border/30">
                <div className="text-xs text-muted-foreground mb-1.5">Function</div>
                <div className="font-mono text-sm flex flex-wrap items-center gap-1">
                  <CopyableAddress
                    address={moduleAddr}
                    href={`/account/${moduleAddr}`}
                    truncateLength={{ start: 6, end: 4 }}
                  />
                  <span className="text-muted-foreground">::</span>
                  <span className="text-blue-400">{moduleName}</span>
                  <span className="text-muted-foreground">::</span>
                  <span className="text-green-400 font-semibold">{funcName}</span>
                </div>
              </div>

              {/* Type Arguments */}
              {typeArgs.length > 0 && (
                <div className="px-5 py-3 border-b border-border/30">
                  <button
                    onClick={() => setShowTypeArgs(!showTypeArgs)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    <span>Type Arguments ({typeArgs.length})</span>
                    {showTypeArgs ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  {showTypeArgs && (
                    <div className="mt-2 space-y-1">
                      {typeArgs.map((typeArg, i) => (
                        <div
                          key={i}
                          className="font-mono text-xs bg-muted/50 px-2 py-1 rounded break-all"
                        >
                          <span className="text-muted-foreground mr-2">[{i}]</span>
                          <span className="text-purple-400">{typeArg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Arguments */}
              <div className="px-5 py-3">
                <div className="text-xs text-muted-foreground mb-2">
                  Arguments ({decodedArgs.length})
                </div>
                {decodedArgs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No arguments</div>
                ) : (
                  <div className="space-y-2">
                    {decodedArgs.map((arg) => (
                      <ArgumentRow key={arg.index} arg={arg} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ArgumentRow({ arg }: { arg: DecodedArgument }) {
  const isAddress = arg.type === "address";
  const isLargeValue =
    typeof arg.value === "string" && arg.value.length > 100;

  return (
    <div className="bg-muted/30 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-muted-foreground font-mono">[{arg.index}]</span>
        <span className="text-sm font-medium text-foreground">{arg.name}</span>
        <Badge variant="outline" className="text-xs font-mono">
          {arg.type}
        </Badge>
      </div>
      <div className="pl-6">
        {isAddress ? (
          <CopyableAddress
            address={arg.value as string}
            href={`/account/${arg.value}`}
            showFull
          />
        ) : isLargeValue ? (
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Show full value ({(arg.value as string).length} chars)
            </summary>
            <div className="mt-1 font-mono text-xs break-all bg-muted/50 px-2 py-1 rounded max-h-40 overflow-auto">
              {String(arg.value)}
            </div>
          </details>
        ) : (
          <span className="font-mono text-sm break-all">{arg.displayValue}</span>
        )}
      </div>
    </div>
  );
}
