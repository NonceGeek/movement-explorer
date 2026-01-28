"use client";

import { useState, useEffect } from "react";
import { Types } from "aptos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeSignerParam } from "@/api/viewFunction";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Loader2 } from "lucide-react";

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
  const [typeArgs, setTypeArgs] = useState<string[]>(
    Array(fn.generic_type_params.length).fill(""),
  );
  const [args, setArgs] = useState<string[]>([]);
  const [ledgerVersion, setLedgerVersion] = useState<string>("");

  const fnParams = removeSignerParam(fn);
  const hasSigner = fnParams.length !== fn.params.length;

  // Initialize args based on params
  useEffect(() => {
    setArgs(Array(fnParams.length).fill(""));
  }, [fnParams.length]);

  const handleTypeArgChange = (index: number, value: string) => {
    const newTypeArgs = [...typeArgs];
    newTypeArgs[index] = value;
    setTypeArgs(newTypeArgs);
  };

  const handleArgChange = (index: number, value: string) => {
    const newArgs = [...args];
    newArgs[index] = value;
    setArgs(newArgs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      typeArgs: typeArgs.filter((t) => t !== ""),
      args,
      ledgerVersion: ledgerVersion || undefined,
    });
  };

  // Check if form is valid (all required fields filled)
  const isFormValid = args.every((arg, i) => {
    const param = fnParams[i];
    // Option types are not required
    if (param?.startsWith("0x1::option::Option")) {
      return true;
    }
    return arg.trim() !== "";
  });

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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Arguments */}
          {fn.generic_type_params.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Type Arguments</Label>
              {fn.generic_type_params.map((_, i) => (
                <div key={`type-${i}`} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">T{i}</Label>
                  <Input
                    placeholder={`Type argument ${i}`}
                    value={typeArgs[i]}
                    onChange={(e) => handleTypeArgChange(i, e.target.value)}
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
                <Input
                  placeholder={`Argument ${i}`}
                  value={args[i] || ""}
                  onChange={(e) => handleArgChange(i, e.target.value)}
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
              <Input
                placeholder="Leave empty for latest"
                value={ledgerVersion}
                onChange={(e) => setLedgerVersion(e.target.value)}
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || (!isView && !connected) || !isFormValid}
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
                Vectors: use JSON or comma-separated (e.g., 0x1, 0x2 or ["0x1",
                "0x2"])
              </li>
              <li>Numbers and booleans without quotes in JSON</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
