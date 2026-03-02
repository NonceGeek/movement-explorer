"use client";

import { useEffect, useMemo } from "react";
import { Types } from "aptos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { removeSignerParam, isValidStruct } from "@/utils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { getMoveTypeValidator, validateLedgerVersion } from "@/utils/moveTypeValidator";

/**
 * Abbreviate long Move types for display.
 * e.g. "0x1::object::Object<0xABC...::liquidity_pool::LiquidityPool>" → "Object<LiquidityPool>"
 */
function abbreviateType(type: string): string {
  return type.replace(/0x[a-fA-F0-9]+::\w+::(\w+)/g, "$1");
}

interface ContractFormProps {
  module: Types.MoveModule;
  fn: Types.MoveFunction;
  isView: boolean;
  onSubmit: (data: ContractFormData) => Promise<void>;
  isLoading?: boolean;
  result?: React.ReactNode;
  paramNames?: string[];
  typeParamNames?: string[];
}

export interface ContractFormData {
  typeArgs: string[];
  args: string[];
  ledgerVersion?: string;
}

export default function ContractForm({
  module,
  fn,
  isView,
  onSubmit,
  isLoading = false,
  result,
  paramNames,
  typeParamNames,
}: ContractFormProps) {
  const { account, connected } = useWallet();
  const fnParams = useMemo(() => removeSignerParam(fn), [fn]);
  const hasSigner = fnParams.length !== fn.params.length;

  const {
    control,
    handleSubmit,
    formState: { isValid },
    reset,
  } = useForm<ContractFormData>({
    mode: "onTouched",
    defaultValues: {
      typeArgs: Array(fn.generic_type_params.length).fill(""),
      args: Array(fnParams.length).fill(""),
      ledgerVersion: "",
    },
  });

  // Reset form when function changes
  useEffect(() => {
    reset({
      typeArgs: Array(fn.generic_type_params.length).fill(""),
      args: Array(fnParams.length).fill(""),
      ledgerVersion: "",
    });
  }, [fn.name, fn.generic_type_params.length, fnParams.length, reset]);

  const onFormSubmit = async (data: ContractFormData) => {
    await onSubmit({
      typeArgs: data.typeArgs.filter((t) => t !== ""),
      args: data.args,
      ledgerVersion: data.ledgerVersion || undefined,
    });
  };

  const isButtonDisabled = isLoading || (!isView && !connected) || !isValid;

  const buttonTooltip = !isValid
    ? "Please fix the validation errors above"
    : !isView && !connected
      ? "Connect wallet to run"
      : null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm rounded-xl border-border/50">
      <CardHeader>
        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap m-0 p-0 bg-transparent">
          <span
            style={{ color: "var(--color-protocol-pink-300)" }}
            className="text-base font-semibold"
          >
            {fn.name}
          </span>
          {fn.generic_type_params.length > 0 && (
            <>
              <span style={{ color: "var(--color-neutrals-white-alpha-500)" }}>
                {"<"}
              </span>
              {fn.generic_type_params.map((_, i) => (
                <span key={`tp-${i}`}>
                  {i > 0 && (
                    <span
                      style={{ color: "var(--color-neutrals-white-alpha-500)" }}
                    >
                      {", "}
                    </span>
                  )}
                  <span style={{ color: "var(--color-oracle-orange-400)" }}>
                    {typeParamNames?.[i] ?? `T${i}`}
                  </span>
                </span>
              ))}
              <span style={{ color: "var(--color-neutrals-white-alpha-500)" }}>
                {">"}
              </span>
            </>
          )}
          <span style={{ color: "var(--color-neutrals-white-alpha-500)" }}>
            {"("}
          </span>
          {fn.params.length > 0 && (
            <>
              {"\n"}
              {(() => {
                let nameIdx = 0;
                return fn.params.map((p, i) => {
                  const isSigner = p === "signer" || p === "&signer";
                  const isLast = i === fn.params.length - 1;
                  if (isSigner) {
                    return (
                      <span key={`p-${i}`}>
                        {"    "}
                        <span style={{ color: "var(--color-guild-green-300)" }}>
                          {p}
                        </span>
                        {!isLast && (
                          <span
                            style={{
                              color: "var(--color-neutrals-white-alpha-500)",
                            }}
                          >
                            {","}
                          </span>
                        )}
                        {"\n"}
                      </span>
                    );
                  }
                  const name = paramNames?.[nameIdx++];
                  const short = abbreviateType(p);
                  return (
                    <span key={`p-${i}`}>
                      {"    "}
                      {name && (
                        <>
                          <span>{name}</span>
                          <span
                            style={{
                              color: "var(--color-neutrals-white-alpha-500)",
                            }}
                          >
                            {": "}
                          </span>
                        </>
                      )}
                      <span
                        style={{ color: "var(--color-byzantine-blue-200)" }}
                      >
                        {short}
                      </span>
                      {!isLast && (
                        <span
                          style={{
                            color: "var(--color-neutrals-white-alpha-500)",
                          }}
                        >
                          {","}
                        </span>
                      )}
                      {"\n"}
                    </span>
                  );
                });
              })()}
            </>
          )}
          <span style={{ color: "var(--color-neutrals-white-alpha-500)" }}>
            {")"}
          </span>
        </pre>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Type Arguments */}
          {fn.generic_type_params.length > 0 && (
            <div className="space-y-3 pb-4 border-b border-border/50">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type Arguments</Label>
              {fn.generic_type_params.map((tp, i) => {
                const name = typeParamNames?.[i] ?? `T${i}`;
                const constraints = tp.constraints;
                return (
                  <div key={`type-${i}`} className="space-y-1">
                    <Label className="text-base flex items-center gap-2">
                      <span className="text-foreground font-medium">
                        {name}
                      </span>
                      {constraints.length > 0 && (
                        <span className="inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40">
                          {constraints.join(" + ")}
                        </span>
                      )}
                    </Label>
                    <Controller
                      name={`typeArgs.${i}`}
                      control={control}
                      rules={{
                        required: "Type argument is required",
                        validate: (v: string) =>
                          v.trim() === "" || isValidStruct(v.trim()) || "Invalid type (expected addr::module::name)",
                      }}
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            placeholder="e.g. 0x1::aptos_coin::AptosCoin"
                            className={
                              fieldState.error
                                ? "border-destructive text-base"
                                : "text-base"
                            }
                          />
                          {fieldState.error?.message && (
                            <p className="text-xs text-destructive mt-1">
                              {fieldState.error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Arguments */}
          {(hasSigner || fnParams.length > 0) && (
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Arguments</Label>
          )}

          {/* Signer (if needed) */}
          {hasSigner && (
            <div className="space-y-1">
              <Label className="text-base flex items-center gap-2">
                <span className="text-foreground font-medium">signer</span>
                <span className="inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40">
                  &signer
                </span>
              </Label>
              <Input
                value={
                  connected
                    ? account?.address?.toString() || ""
                    : "Connect wallet"
                }
                disabled
                className="font-mono text-base"
              />
            </div>
          )}

          {/* Function Arguments */}
          {fnParams.map((param, i) => {
            const isOption = param.startsWith("0x1::option::Option");
            const shortType = abbreviateType(param);
            const isAbbreviated = shortType !== param;
            return (
              <div key={`arg-${i}`} className="space-y-1">
                <Label className="text-base flex items-center gap-2 flex-wrap">
                  <span className="text-foreground font-medium">
                    {paramNames?.[i] ?? `arg${i}`}
                  </span>
                  {isAbbreviated ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground cursor-help border border-border/40">
                            {shortType}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-sm font-mono text-xs break-all"
                        >
                          {param}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="inline-flex items-center font-mono text-xs px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40">
                      {param}
                    </span>
                  )}
                  {isOption && (
                    <span className="text-xs text-muted-foreground/70 italic">
                      optional
                    </span>
                  )}
                </Label>
                <Controller
                  name={`args.${i}`}
                  control={control}
                  rules={{
                    required: !isOption && "Argument is required",
                    validate: getMoveTypeValidator(param),
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        placeholder={paramNames?.[i] ?? `Argument ${i}`}
                        className={fieldState.error ? "border-destructive" : ""}
                      />
                      {fieldState.error?.message && (
                        <p className="text-xs text-destructive mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            );
          })}

          {/* Ledger Version (for view functions) */}
          {isView && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ledger Version
              </Label>
              <Controller
                name="ledgerVersion"
                control={control}
                rules={{
                  validate: (v) => validateLedgerVersion(v ?? ""),
                }}
                render={({ field, fieldState }) => (
                  <>
                    <Input {...field} placeholder="Leave empty for latest" />
                    {fieldState.error?.message && (
                      <p className="text-xs text-destructive mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          )}

          {/* Submit Button with Tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    type="submit"
                    disabled={isButtonDisabled}
                    className="w-32"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isView ? "Viewing..." : "Running..."}
                      </>
                    ) : isView ? (
                      "View"
                    ) : (
                      "Run"
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {buttonTooltip && (
                <TooltipContent>
                  <p>{buttonTooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* Result */}
          {result}

          {/* Usage Instructions */}
          <div className="mt-6 pt-4 border-t border-border space-y-2">
            <p className="text-base font-medium text-muted-foreground">
              How to use:
            </p>
            <ul className="text-base text-muted-foreground space-y-1 list-disc ml-4">
              <li>Option arguments can be empty (will be Option::none)</li>
              <li>Nested vectors must be in JSON format</li>
              <li>
                Vectors: use JSON or comma-separated (e.g., 0x1, 0x2 or
                [&quot;0x1&quot;, &quot;0x2&quot;])
              </li>
              <li>vector&lt;u8&gt;: supports hex format (0xDEADBEEF)</li>
              <li>Numbers and booleans without quotes in JSON</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
