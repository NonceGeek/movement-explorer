"use client";

import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import JsonViewer from "@/components/ui/json-viewer";
import { cn } from "@/utils/styling";
import Link from "next/link";
import { ListTree, ChevronRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Types } from "aptos";
import { formatMovementPath, abbreviateType } from "@/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  useGetFunctionParams,
  type ResolvedParam,
} from "@/hooks/accounts/useGetFunctionParams";

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
  "0x1::managed_coin::mint": {
    args: [
      { name: "dst_addr", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::managed_coin::burn": {
    args: [{ name: "amount", type: "u64" }],
  },
  "0x1::coin::register": {
    args: [],
  },
  "0x1::code::publish_package_txn": {
    args: [
      { name: "metadata_serialized", type: "vector<u8>" },
      { name: "code", type: "vector<vector<u8>>" },
    ],
  },
  "0x1::aptos_account::create_account": {
    args: [{ name: "auth_key", type: "address" }],
  },
  "0x1::aptos_account::batch_transfer": {
    args: [
      { name: "recipients", type: "vector<address>" },
      { name: "amounts", type: "vector<u64>" },
    ],
  },
  "0x1::aptos_account::batch_transfer_coins": {
    args: [
      { name: "recipients", type: "vector<address>" },
      { name: "amounts", type: "vector<u64>" },
    ],
  },
  "0x1::resource_account::create_resource_account": {
    args: [{ name: "seed", type: "vector<u8>" }],
  },
  "0x1::resource_account::create_resource_account_and_publish_package": {
    args: [
      { name: "seed", type: "vector<u8>" },
      { name: "metadata_serialized", type: "vector<u8>" },
      { name: "code", type: "vector<vector<u8>>" },
    ],
  },
  "0x1::multisig_account::create_with_owners": {
    args: [
      { name: "additional_owners", type: "vector<address>" },
      { name: "num_signatures_required", type: "u64" },
      { name: "metadata_keys", type: "vector<String>" },
      { name: "metadata_values", type: "vector<vector<u8>>" },
    ],
  },
  "0x1::account::rotate_authentication_key": {
    args: [
      { name: "from_scheme", type: "u8" },
      { name: "from_public_key_bytes", type: "vector<u8>" },
      { name: "to_scheme", type: "u8" },
      { name: "to_public_key_bytes", type: "vector<u8>" },
      { name: "cap_rotate_key", type: "vector<u8>" },
      { name: "cap_update_table", type: "vector<u8>" },
    ],
  },
  "0x1::delegation_pool::reactivate_stake": {
    args: [
      { name: "pool_address", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x1::aptos_governance::create_proposal": {
    args: [
      { name: "stake_pool", type: "address" },
      { name: "execution_hash", type: "vector<u8>" },
      { name: "metadata_location", type: "vector<u8>" },
      { name: "metadata_hash", type: "vector<u8>" },
    ],
  },
  "0x1::aptos_governance::vote": {
    args: [
      { name: "stake_pool", type: "address" },
      { name: "proposal_id", type: "u64" },
      { name: "should_pass", type: "bool" },
    ],
  },
  "0x1::aptos_account::fungible_transfer_only": {
    args: [
      { name: "metadata", type: "Object<Metadata>" },
      { name: "to", type: "address" },
      { name: "amount", type: "u64" },
    ],
  },
  // 0x4:: Digital Assets (Token V2)
  "0x4::aptos_token::mint": {
    args: [
      { name: "collection", type: "Object<Collection>" },
      { name: "description", type: "String" },
      { name: "name", type: "String" },
      { name: "uri", type: "String" },
      { name: "property_keys", type: "vector<String>" },
      { name: "property_types", type: "vector<String>" },
      { name: "property_values", type: "vector<vector<u8>>" },
    ],
  },
  "0x4::aptos_token::mint_soul_bound": {
    args: [
      { name: "collection", type: "Object<Collection>" },
      { name: "description", type: "String" },
      { name: "name", type: "String" },
      { name: "property_keys", type: "vector<String>" },
      { name: "property_types", type: "vector<String>" },
      { name: "property_values", type: "vector<vector<u8>>" },
      { name: "uri", type: "String" },
      { name: "soul_bound_to", type: "address" },
    ],
  },
  "0x4::aptos_token::burn": {
    args: [{ name: "token", type: "Object<Token>" }],
  },
  "0x4::aptos_token::freeze_transfer": {
    args: [{ name: "token", type: "Object<Token>" }],
  },
  "0x4::aptos_token::unfreeze_transfer": {
    args: [{ name: "token", type: "Object<Token>" }],
  },
  "0x4::aptos_token::set_description": {
    args: [
      { name: "token", type: "Object<Token>" },
      { name: "description", type: "String" },
    ],
  },
  "0x4::aptos_token::set_uri": {
    args: [
      { name: "token", type: "Object<Token>" },
      { name: "uri", type: "String" },
    ],
  },
  // 0x3:: Legacy Token V1
  "0x3::token::create_token_script": {
    args: [
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "description", type: "String" },
      { name: "supply", type: "u64" },
      { name: "maximum", type: "u64" },
      { name: "uri", type: "String" },
      { name: "royalty_payee_address", type: "address" },
      { name: "royalty_points_denominator", type: "u64" },
      { name: "royalty_points_numerator", type: "u64" },
      { name: "mutate_setting", type: "vector<bool>" },
      { name: "property_keys", type: "vector<String>" },
      { name: "property_values", type: "vector<vector<u8>>" },
      { name: "property_types", type: "vector<String>" },
    ],
  },
  "0x3::token::mint_script": {
    args: [
      { name: "token_data_address", type: "address" },
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x3::token_transfers::offer_script": {
    args: [
      { name: "receiver", type: "address" },
      { name: "creator", type: "address" },
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "property_version", type: "u64" },
      { name: "amount", type: "u64" },
    ],
  },
  "0x3::token_transfers::claim_script": {
    args: [
      { name: "sender", type: "address" },
      { name: "creator", type: "address" },
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "property_version", type: "u64" },
    ],
  },
  "0x3::token_transfers::cancel_offer_script": {
    args: [
      { name: "receiver", type: "address" },
      { name: "creator", type: "address" },
      { name: "collection", type: "String" },
      { name: "name", type: "String" },
      { name: "property_version", type: "u64" },
    ],
  },
};

function decodeArguments(
  func: string,
  args: unknown[],
  _typeArgs: string[],
  dynamicParams: ResolvedParam[] | null,
): DecodedArgument[] {
  const known = KNOWN_FUNCTIONS[func];
  const decoded: DecodedArgument[] = [];

  args.forEach((arg, index) => {
    // Priority 1: KNOWN_FUNCTIONS hardcoded table
    const knownArg = known?.args[index];
    // Priority 2: Dynamic ABI + source code
    const dynamicArg = dynamicParams?.[index];
    // Priority 3: Inference fallback
    const name = knownArg?.name ?? dynamicArg?.name ?? `arg_${index}`;
    const type = knownArg?.type ?? dynamicArg?.type ?? inferType(arg);
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
  const [typeArgsExpanded, setTypeArgsExpanded] = useState(false);
  const [argsExpanded, setArgsExpanded] = useState(false);

  // Extract entry payload and function path before hooks (rules of hooks: no conditional calls)
  const isEntryFunction = payload?.type === "entry_function_payload";
  const isScript = payload?.type === "script_payload";
  const isMultisig = payload?.type === "multisig_payload";

  const entryPayload = isEntryFunction
    ? (payload as Types.TransactionPayload_EntryFunctionPayload)
    : isMultisig &&
        payload &&
        "transaction_payload" in payload &&
        payload.transaction_payload
      ? (payload.transaction_payload as Types.TransactionPayload_EntryFunctionPayload)
      : null;

  const func = entryPayload?.function || "";
  const isKnown = func in KNOWN_FUNCTIONS;

  // Dynamically resolve param names/types from ABI + source code (only for unknown functions)
  const { params: dynamicParams, isLoading: paramsLoading } =
    useGetFunctionParams(isKnown || !func ? null : func);

  if (!payload) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No payload data available
      </div>
    );
  }

  const args = entryPayload?.arguments || [];
  const typeArgs = entryPayload?.type_arguments || [];
  const decodedArgs = entryPayload
    ? decodeArguments(func, args, typeArgs, dynamicParams)
    : [];

  const funcParts = func.split("::");
  const moduleAddr = funcParts[0] || "";
  const moduleName = funcParts[1] || "";
  const funcName = funcParts[2] || "";

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Mode Toggle */}
      <ToggleGroup
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "decoded" | "raw")}
      >
        <ToggleGroupItem value="decoded">
          <ListTree className="h-3.5 w-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="raw">RAW</ToggleGroupItem>
      </ToggleGroup>

      {viewMode === "raw" ? (
        <JsonViewer data={payload} initialDepth={2} />
      ) : (
        <div className="space-y-4">
          <div className="bg-card backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden divide-y divide-border/20">
          {/* Payload Type */}
          <div className="px-5 py-2.5 flex items-center gap-2.5 bg-muted/40">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
              Type
            </span>
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
              <JsonViewer data={payload} initialDepth={1} />
            </div>
          )}

          {entryPayload && (
            <>
              {/* Address */}
              <div className="px-5 py-3 flex items-center gap-3">
                <span className="text-sm text-muted-foreground shrink-0 min-w-40">
                  Address
                </span>
                <CopyableAddress
                  address={moduleAddr}
                  href={`/account/${moduleAddr}`}
                  showFull
                />
              </div>

              {/* Module */}
              <div className="px-5 py-3 flex items-center gap-3">
                <span className="text-sm text-muted-foreground shrink-0 min-w-40">
                  Module
                </span>
                <Link
                  href={`/account/${moduleAddr}/modules/code/${moduleName}`}
                  className="font-mono text-sm text-primary hover:underline break-all"
                >
                  {formatMovementPath(moduleName)}
                </Link>
              </div>

              {/* Signature */}
              <div className="px-5 py-3 flex items-start gap-3">
                <span className="text-sm text-muted-foreground shrink-0 mt-1.5 min-w-40">
                  Signature
                </span>
                <div className="font-mono text-sm bg-muted/30 px-3 py-1.5 rounded-lg break-all [&_span]:inline flex-1 min-w-0">
                  <Link
                    href={`/account/${moduleAddr}/modules/code/${moduleName}/${funcName}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {funcName}
                  </Link>
                  {typeArgs.length > 0 && (
                    <>
                      <span className="text-muted-foreground">&lt;</span>
                      {typeArgs.length <= 2
                        ? typeArgs.map((typeArg, i) => (
                            <span key={i}>
                              {i > 0 && (
                                <span className="text-muted-foreground">
                                  ,{" "}
                                </span>
                              )}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-blue-400">
                                      {abbreviateType(
                                        formatMovementPath(typeArg),
                                      )}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="font-mono text-xs max-w-md break-all">
                                    {formatMovementPath(typeArg)}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                          ))
                        : (() => {
                            const visible = typeArgsExpanded
                              ? typeArgs
                              : typeArgs.slice(0, 6);
                            const hiddenCount = typeArgs.length - 6;
                            return (
                              <>
                                {visible.map((typeArg, i) => (
                                  <div key={i} className="pl-4 break-all">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-blue-400">
                                            {abbreviateType(
                                              formatMovementPath(typeArg),
                                            )}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-mono text-xs max-w-md break-all">
                                          {formatMovementPath(typeArg)}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    {(i < visible.length - 1 ||
                                      (!typeArgsExpanded &&
                                        hiddenCount > 0)) && (
                                      <span className="text-muted-foreground">
                                        ,
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {hiddenCount > 0 && (
                                  <div
                                    className="pl-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1"
                                    onClick={() =>
                                      setTypeArgsExpanded(!typeArgsExpanded)
                                    }
                                  >
                                    <ChevronRight
                                      className={cn(
                                        "size-3.5 shrink-0 transition-transform",
                                        typeArgsExpanded && "rotate-90",
                                      )}
                                    />
                                    {typeArgsExpanded
                                      ? "collapse"
                                      : `${hiddenCount} more`}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                      <span className="text-muted-foreground">&gt;</span>
                    </>
                  )}
                  <span className="text-muted-foreground">(</span>
                  {decodedArgs.length <= 2
                    ? decodedArgs.map((arg, i) => (
                        <span key={arg.index}>
                          {i > 0 && (
                            <span className="text-muted-foreground">, </span>
                          )}
                          <span className="text-foreground">{arg.name}</span>
                          <span className="text-muted-foreground">: </span>
                          <span className="text-purple-400">
                            {abbreviateType(arg.type)}
                          </span>
                        </span>
                      ))
                    : (() => {
                        const visibleArgs = argsExpanded
                          ? decodedArgs
                          : decodedArgs.slice(0, 6);
                        const hiddenArgCount = decodedArgs.length - 6;
                        return (
                          <>
                            {visibleArgs.map((arg, i) => (
                              <div
                                key={arg.index}
                                className="pl-4 break-all"
                              >
                                <span className="text-foreground">
                                  {arg.name}
                                </span>
                                <span className="text-muted-foreground">
                                  :{" "}
                                </span>
                                <span className="text-purple-400">
                                  {abbreviateType(arg.type)}
                                </span>
                                {(i < visibleArgs.length - 1 ||
                                  (!argsExpanded && hiddenArgCount > 0)) && (
                                  <span className="text-muted-foreground">
                                    ,
                                  </span>
                                )}
                              </div>
                            ))}
                            {hiddenArgCount > 0 && (
                              <div
                                className="pl-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1"
                                onClick={() =>
                                  setArgsExpanded(!argsExpanded)
                                }
                              >
                                <ChevronRight
                                  className={cn(
                                    "size-3.5 shrink-0 transition-transform",
                                    argsExpanded && "rotate-90",
                                  )}
                                />
                                {argsExpanded
                                  ? "collapse"
                                  : `${hiddenArgCount} more`}
                              </div>
                            )}
                          </>
                        );
                      })()}
                  <span className="text-muted-foreground">)</span>
                  {paramsLoading && !isKnown && (
                    <span className="ml-1.5 text-xs opacity-50 animate-pulse">
                      resolving...
                    </span>
                  )}
                </div>
              </div>

            </>
          )}
          </div>

          {entryPayload && (
            <div className="bg-card backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden divide-y divide-border/20">
              {/* Arguments Header */}
              <div className="px-5 py-2.5 flex items-center gap-2.5 bg-muted/40">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                  Arguments
                </span>
                <Badge variant="secondary" className="text-xs">
                  {decodedArgs.length}
                </Badge>
              </div>

              {/* Argument Rows */}
              {decodedArgs.length === 0 ? (
                <div className="px-5 py-3 text-sm text-muted-foreground">
                  No arguments
                </div>
              ) : (
                <div className="grid grid-cols-[minmax(160px,280px)_1fr]">
                  {decodedArgs.map((arg, idx) => {
                    const notLast = idx < decodedArgs.length - 1;
                    const isFallback = arg.name.startsWith("arg_");
                    const borderClass = notLast
                      ? "border-b border-border/20"
                      : "";
                    return (
                      <Fragment key={arg.index}>
                        <div className={cn("px-5 py-3", borderClass)}>
                          <div className="text-sm text-muted-foreground font-mono wrap-break-word mb-1.5">
                            {isFallback
                              ? `#${arg.index}`
                              : arg.name.replace(/_/g, "_​")}
                          </div>
                          <TypeBadge type={arg.type} />
                        </div>
                        <div
                          className={cn("px-5 py-3 min-w-0", borderClass)}
                        >
                          <ArgumentValue arg={arg} />
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const LONG_VALUE_THRESHOLD = 120;

function FoldedLongString({ value }: { value: string }) {
  return (
    <details className="group">
      <summary className="cursor-pointer flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden list-none">
        <ChevronRight className="size-3.5 shrink-0 transition-transform group-open:rotate-90" />
        <span className="break-all min-w-0 flex-1">
          <span className="text-foreground/80">{value.slice(0, 40)}</span>
          <span className="opacity-50">…</span>
          <span className="text-foreground/80">{value.slice(-16)}</span>
        </span>
        <span className="opacity-60 shrink-0 text-xs">
          {value.length.toLocaleString()} chars
        </span>
      </summary>
      <div className="mt-2 font-mono text-sm break-all bg-muted/30 px-3 py-2 rounded-lg max-h-60 overflow-auto">
        {value}
      </div>
    </details>
  );
}

function tryParseJson(
  value: unknown,
): { parsed: true; data: unknown } | { parsed: false } {
  if (typeof value !== "string") return { parsed: false };
  const trimmed = value.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("[")))
    return { parsed: false };
  try {
    return { parsed: true, data: JSON.parse(trimmed) };
  } catch {
    return { parsed: false };
  }
}

function isAddressValue(value: unknown): boolean {
  return (
    typeof value === "string" && value.startsWith("0x") && value.length >= 10
  );
}

/** Move Object<T> is serialized as {inner: "0x..."} */
function extractObjectAddress(value: unknown): string | null {
  if (typeof value === "object" && value !== null && "inner" in value) {
    const inner = (value as { inner: unknown }).inner;
    if (typeof inner === "string" && inner.startsWith("0x")) return inner;
  }
  return null;
}

/** Recursive value renderer — handles any value with smart type detection */
function SmartValue({
  value,
  typeHint,
}: {
  value: unknown;
  typeHint?: string;
}) {
  // Address string
  if (isAddressValue(value) && typeof value === "string") {
    return (
      <CopyableAddress
        address={value}
        href={`/account/${value}`}
        showFull
        className="text-sm"
      />
    );
  }

  // Object<T> pattern: {inner: "0x..."}
  const objectAddr = extractObjectAddress(value);
  if (objectAddr) {
    return (
      <CopyableAddress
        address={objectAddr}
        href={`/account/${objectAddr}`}
        showFull
        className="text-sm"
      />
    );
  }

  // vector<u8> hex bytes (serialized as a single hex string)
  if (typeHint === "vector<u8>" && typeof value === "string") {
    if (value.length > LONG_VALUE_THRESHOLD) {
      return <FoldedLongString value={value} />;
    }
    return (
      <div className="font-mono text-sm bg-muted/30 px-3 py-2 rounded-lg break-all">
        {value}
      </div>
    );
  }

  // Array — render each item with index, recursively
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className="font-mono text-sm text-muted-foreground">
          [] (empty)
        </span>
      );
    }
    // Derive inner type hint: strip outermost vector<...>
    const innerType =
      typeHint?.startsWith("vector<") && typeHint.endsWith(">")
        ? typeHint.slice(7, -1)
        : undefined;
    // Check if any item is a nested array/object (complex)
    const hasComplexItems = value.some(
      (item) =>
        Array.isArray(item) ||
        (typeof item === "object" &&
          item !== null &&
          !extractObjectAddress(item)),
    );

    const COLLAPSE_THRESHOLD = 5;
    const shouldCollapse = value.length > COLLAPSE_THRESHOLD;

    if (hasComplexItems) {
      // Nested structures — each item open by default
      const list = (
        <div className="space-y-1">
          {value.map((item, i) => (
            <details key={i} open className="group">
              <summary className="cursor-pointer flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-mono py-0.5 [&::-webkit-details-marker]:hidden list-none">
                <ChevronRight className="size-3.5 shrink-0 transition-transform group-open:rotate-90" />
                <span className="text-muted-foreground/80 shrink-0 text-xs">
                  [{i}]
                </span>
                <span>
                  {Array.isArray(item)
                    ? `${item.length} ${item.length === 1 ? "item" : "items"}`
                    : "object"}
                </span>
              </summary>
              <div className="ml-5 pl-3 border-l border-border/30 mt-1">
                <SmartValue value={item} typeHint={innerType} />
              </div>
            </details>
          ))}
        </div>
      );
      if (shouldCollapse) {
        return (
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-mono py-0.5 [&::-webkit-details-marker]:hidden list-none">
              <ChevronRight className="size-3.5 shrink-0 transition-transform group-open:rotate-90" />
              <span>[{value.length} items]</span>
            </summary>
            <div className="mt-1">{list}</div>
          </details>
        );
      }
      return list;
    }

    // Flat list for leaf values
    const list = (
      <div className="space-y-1">
        {value.map((item, i) => (
          <div key={i} className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground/80 shrink-0 font-mono">
              [{i}]
            </span>
            <div className="min-w-0 flex-1">
              <SmartValue value={item} typeHint={innerType} />
            </div>
          </div>
        ))}
      </div>
    );
    if (shouldCollapse) {
      return (
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-mono py-0.5 [&::-webkit-details-marker]:hidden list-none">
            <ChevronRight className="size-3.5 shrink-0 transition-transform group-open:rotate-90" />
            <span>[{value.length} items]</span>
          </summary>
          <div className="mt-1">{list}</div>
        </details>
      );
    }
    return list;
  }

  // Non-array object (not Object<T>, handled above)
  if (typeof value === "object" && value !== null) {
    return <JsonViewer data={value} initialDepth={1} />;
  }

  // Boolean (JS boolean or string "true"/"false" with bool typeHint)
  if (
    typeof value === "boolean" ||
    (typeHint === "bool" && (value === "true" || value === "false"))
  ) {
    const boolVal = typeof value === "boolean" ? value : value === "true";
    return (
      <span
        className={`font-mono text-sm ${boolVal ? "text-emerald-400" : "text-rose-400"}`}
      >
        {String(boolVal)}
      </span>
    );
  }

  // Numeric value (JS number or string with numeric typeHint)
  const isNumericType = /^u(8|16|32|64|128|256)$/.test(typeHint ?? "");
  if (
    typeof value === "number" ||
    (isNumericType && typeof value === "string" && /^\d+$/.test(value))
  ) {
    const display =
      typeof value === "number"
        ? value.toLocaleString()
        : BigInt(value).toLocaleString();
    return <span className="font-mono text-sm text-foreground">{display}</span>;
  }

  // String
  if (typeof value === "string") {
    // JSON string
    const jsonResult = tryParseJson(value);
    if (jsonResult.parsed) {
      return <JsonViewer data={jsonResult.data} initialDepth={1} />;
    }
    // Large string
    if (value.length > LONG_VALUE_THRESHOLD) {
      return <FoldedLongString value={value} />;
    }
    // Short string / number-like
    return <span className="font-mono text-sm break-all">{value}</span>;
  }

  // Default
  return <span className="font-mono text-sm break-all">{String(value)}</span>;
}

function ArgumentValue({ arg }: { arg: DecodedArgument }) {
  return <SmartValue value={arg.value} typeHint={arg.type} />;
}

function TypeBadge({ type }: { type: string }) {
  const short = abbreviateType(type);
  const isAbbreviated = short !== type;
  const badge = (
    <span
      className={cn(
        "inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded bg-muted/60 text-foreground/70 border border-border/40 shrink-0",
        isAbbreviated && "cursor-help",
      )}
    >
      {short}
    </span>
  );
  if (!isAbbreviated) return badge;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-sm font-mono text-xs break-all"
        >
          {type}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
