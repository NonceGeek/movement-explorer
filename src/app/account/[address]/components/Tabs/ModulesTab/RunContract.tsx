"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ExternalLink, Play } from "lucide-react";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../..";
import {
  useWallet,
  InputTransactionData,
} from "@aptos-labs/wallet-adapter-react";
import { Types } from "aptos";
import Link from "next/link";
import { useGetAccountModules } from "@/hooks/accounts/useGetAccountModules";
import useSubmitTransaction from "@/hooks/transactions/useSubmitTransaction";
import { removeSignerParam } from "@/utils";
import { WalletConnector } from "@/components/wallet/WalletConnector";
import ModuleSidebar from "./ModuleSidebar";
import ContractForm, { ContractFormData } from "./ContractForm";

interface RunContractProps {
  address: string;
  isObject?: boolean;
  selectedModuleName?: string;
  selectedFnName?: string;
  onModuleSelect: (moduleName: string) => void;
}

export default function RunContract({
  address,
  isObject = false,
  selectedModuleName,
  selectedFnName,
  onModuleSelect,
}: RunContractProps) {
  const { data: modules, isLoading: modulesLoading } =
    useGetAccountModules(address);
  const { connected } = useWallet();
  const {
    submitTransaction,
    transactionInProcess,
    transactionResponse,
    clearTransactionResponse,
  } = useSubmitTransaction();

  const [currentFnName, setCurrentFnName] = useState<string>(
    selectedFnName || "",
  );

  // Filter for entry functions only
  const filterEntryFns = useCallback(
    (fn: Types.MoveFunction) => fn.is_entry,
    [],
  );

  // Find the selected module
  const selectedModule = modules?.find(
    (m) => m.abi?.name === selectedModuleName,
  );

  // Find the selected function
  const selectedFn = selectedModule?.abi?.exposed_functions.find(
    (fn) => fn.name === currentFnName && fn.is_entry,
  );

  const handleFunctionSelect = (moduleName: string, fnName: string) => {
    onModuleSelect(moduleName);
    setCurrentFnName(fnName);
    clearTransactionResponse();
  };

  const convertArgument = (
    arg: string | null | undefined,
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any => {
    if (typeof arg !== "string") {
      arg = "";
    }
    arg = arg.trim();

    // Handle vector types
    if (type.startsWith("vector<")) {
      if (arg.startsWith("[")) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return JSON.parse(arg) as any[];
        } catch {
          return arg.split(",").map((s) => s.trim());
        }
      }
      return arg.split(",").map((s) => s.trim());
    }

    // Handle option types
    if (type.startsWith("0x1::option::Option")) {
      if (arg === "") {
        return undefined;
      }
    }

    return arg;
  };

  const handleSubmit = async (data: ContractFormData) => {
    if (!selectedModule?.abi || !selectedFn) return;

    const fnParams = removeSignerParam(selectedFn);

    const payload: InputTransactionData = {
      data: {
        function: `${selectedModule.abi.address}::${selectedModule.abi.name}::${selectedFn.name}`,
        typeArguments: data.typeArgs,
        functionArguments: data.args.map((arg, i) => {
          const type = fnParams[i];
          return convertArgument(arg, type);
        }),
      },
    };

    await submitTransaction(payload);
  };

  const isSuccess =
    transactionResponse?.transactionSubmitted && transactionResponse?.success;

  if (modulesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <EnhancedSkeleton className="h-8 w-32 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="md:col-span-3">
          <EnhancedSkeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <EmptyState
        icon={<Play className="h-12 w-12" />}
        title="No Modules Found"
        description="This account doesn't have any deployed modules."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="md:col-span-1">
        <ModuleSidebar
          modules={modules}
          selectedModuleName={selectedModuleName}
          selectedFnName={currentFnName}
          onModuleSelect={onModuleSelect}
          onFunctionSelect={handleFunctionSelect}
          filterFn={filterEntryFns}
          title="Entry Functions"
        />
      </div>

      {/* Main Content */}
      <div className="md:col-span-3">
        {!connected ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-muted-foreground text-center">
                  Connect your wallet to run contract functions
                </p>
                <WalletConnector />
              </div>
            </CardContent>
          </Card>
        ) : selectedModule?.abi && selectedFn ? (
          <ContractForm
            module={selectedModule.abi}
            fn={selectedFn}
            isView={false}
            onSubmit={handleSubmit}
            isLoading={transactionInProcess}
            result={
              <>
                {/* Success Result */}
                {transactionResponse?.transactionSubmitted && (
                  <Alert
                    className={`mt-4 ${isSuccess
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-destructive/10 border-destructive/20"
                      }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <AlertDescription className="ml-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {isSuccess
                            ? "Transaction successful"
                            : "Transaction failed"}
                        </p>
                        {transactionResponse.transactionHash && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Hash:
                            </span>
                            <code className="text-xs font-mono">
                              {transactionResponse.transactionHash.slice(0, 20)}
                              ...
                            </code>
                            <Link
                              href={`/txn/${transactionResponse.transactionHash}`}
                              className="text-primary hover:underline"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        )}
                        {transactionResponse.message && (
                          <p className="text-xs text-muted-foreground">
                            {transactionResponse.message}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            }
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Select an entry function from the sidebar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
