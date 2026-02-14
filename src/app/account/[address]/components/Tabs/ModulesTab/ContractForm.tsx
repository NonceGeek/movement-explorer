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
import { removeSignerParam } from "@/utils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";

interface ContractFormProps {
  module: Types.MoveModule;
  fn: Types.MoveFunction;
  isView: boolean;
  onSubmit: (data: ContractFormData) => Promise<void>;
  isLoading?: boolean;
  result?: React.ReactNode;
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
    mode: "all",
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
    ? "Input arguments cannot be empty"
    : !isView && !connected
      ? "Connect wallet to run"
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-base">
          {fn.name}
          {fn.generic_type_params.length > 0 && (
            <span className="text-muted-foreground">
              {"<"}
              {fn.generic_type_params.map((_, i) => `T${i}`).join(", ")}
              {">"}
            </span>
          )}
          <span className="text-muted-foreground text-sm font-normal ml-2">
            ({fn.params.join(", ")})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Type Arguments */}
          {fn.generic_type_params.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Type Arguments</Label>
              {fn.generic_type_params.map((_, i) => (
                <div key={`type-${i}`} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">T{i}</Label>
                  <Controller
                    name={`typeArgs.${i}`}
                    control={control}
                    rules={{ required: true }}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        placeholder={`Type argument ${i}`}
                        className={
                          fieldState.invalid ? "border-destructive" : ""
                        }
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Signer (if needed) */}
          {hasSigner && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">signer</Label>
              <Input
                value={
                  connected
                    ? account?.address?.toString() || ""
                    : "Connect wallet"
                }
                disabled
                className="font-mono text-xs"
              />
            </div>
          )}

          {/* Function Arguments */}
          {fnParams.map((param, i) => {
            const isOption = param.startsWith("0x1::option::Option");
            return (
              <div key={`arg-${i}`} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  arg{i}: {param}
                  {isOption && (
                    <span className="text-muted-foreground/60 ml-1">
                      (optional)
                    </span>
                  )}
                </Label>
                <Controller
                  name={`args.${i}`}
                  control={control}
                  rules={{ required: !isOption }}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      placeholder={`Argument ${i}`}
                      className={
                        fieldState.invalid ? "border-destructive" : ""
                      }
                    />
                  )}
                />
              </div>
            );
          })}

          {/* Ledger Version (for view functions) */}
          {isView && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Ledger Version (optional, defaults to latest)
              </Label>
              <Controller
                name="ledgerVersion"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Leave empty for latest" />
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
            <p className="text-xs font-medium text-muted-foreground">
              How to use:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-4">
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
