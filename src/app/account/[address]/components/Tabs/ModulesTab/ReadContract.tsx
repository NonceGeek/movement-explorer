"use client";

import { useState, useCallback } from "react";
import { Types } from "aptos";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Copy, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { useGetAccountModules } from "@/hooks/accounts/useGetAccountModules";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  viewFunction,
  encodeInputArgsForViewRequest,
} from "@/api/viewFunction";
import ModuleSidebar from "./ModuleSidebar";
import ContractForm, { ContractFormData } from "./ContractForm";

interface ReadContractProps {
  address: string;
  isObject?: boolean;
  selectedModuleName?: string;
  selectedFnName?: string;
  onModuleSelect: (moduleName: string) => void;
}

export default function ReadContract({
  address,
  isObject = false,
  selectedModuleName,
  selectedFnName,
  onModuleSelect,
}: ReadContractProps) {
  const { data: modules, isLoading: modulesLoading } =
    useGetAccountModules(address);
  const { aptos_client } = useGlobalStore();

  const [currentFnName, setCurrentFnName] = useState<string>(
    selectedFnName || "",
  );
  const [result, setResult] = useState<Types.MoveValue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter for view functions only
  const filterViewFns = useCallback((fn: Types.MoveFunction) => fn.is_view, []);

  // Find the selected module
  const selectedModule = modules?.find(
    (m) => m.abi?.name === selectedModuleName,
  );

  // Find the selected function
  const selectedFn = selectedModule?.abi?.exposed_functions.find(
    (fn) => fn.name === currentFnName && fn.is_view,
  );

  const handleFunctionSelect = (moduleName: string, fnName: string) => {
    onModuleSelect(moduleName);
    setCurrentFnName(fnName);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (data: ContractFormData) => {
    if (!selectedModule?.abi || !selectedFn) return;

    setIsExecuting(true);
    setResult(null);
    setError(null);

    try {
      const viewRequest: Types.ViewRequest = {
        function: `${selectedModule.abi.address}::${selectedModule.abi.name}::${selectedFn.name}`,
        type_arguments: data.typeArgs,
        arguments: data.args.map((arg, i) =>
          encodeInputArgsForViewRequest(selectedFn.params[i], arg),
        ),
      };

      const response = await viewFunction(
        viewRequest,
        aptos_client,
        data.ledgerVersion,
      );
      setResult(response);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
      setError(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const resultString = result
    ? result
        .map((r) => (typeof r === "string" ? r : JSON.stringify(r, null, 2)))
        .join("\n")
    : "";

  const handleCopyResult = async () => {
    await navigator.clipboard.writeText(resultString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (modulesLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading modules...</p>
        </CardContent>
      </Card>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No modules found</p>
        </CardContent>
      </Card>
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
          filterFn={filterViewFns}
          title="View Functions"
        />
      </div>

      {/* Main Content */}
      <div className="md:col-span-3">
        {selectedModule?.abi && selectedFn ? (
          <ContractForm
            module={selectedModule.abi}
            fn={selectedFn}
            isView={true}
            onSubmit={handleSubmit}
            isLoading={isExecuting}
            result={
              <>
                {/* Success Result */}
                {result && (
                  <Alert className="mt-4 bg-green-500/10 border-green-500/20">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="ml-2">
                      <div className="flex items-start justify-between gap-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all flex-1">
                          {resultString}
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyResult}
                          className="h-6 px-2 flex-shrink-0"
                        >
                          {copied ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Result */}
                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                        {error}
                      </pre>
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
                Select a view function from the sidebar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
