"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileCode } from "lucide-react";
import { useGetAccountModules } from "@/hooks/accounts/useGetAccountModules";
import { useGetAccountModule } from "@/hooks/accounts/useGetAccountModule";
import { useGetAccountPackages } from "@/hooks/accounts/useGetAccountPackages";
import { getBytecodeSizeInKB } from "@/utils";
import AbiDisplay from "./AbiDisplay";

interface ViewCodeProps {
  address: string;
  isObject?: boolean;
  selectedModuleName?: string;
  onModuleSelect: (moduleName: string) => void;
}

export default function ViewCode({
  address,
  isObject = false,
  selectedModuleName,
  onModuleSelect,
}: ViewCodeProps) {
  const router = useRouter();
  const { data: modules, isLoading } = useGetAccountModules(address);
  const packages = useGetAccountPackages(address);

  // Get module names from packages (which have source code)
  const moduleNames = useMemo(() => {
    return packages.flatMap((pkg) => pkg.modules.map((m) => m.name)).sort();
  }, [packages]);

  // Find the module with source code
  const selectedModuleWithSource = useMemo(() => {
    for (const pkg of packages) {
      const mod = pkg.modules.find((m) => m.name === selectedModuleName);
      if (mod) return { ...mod, packageName: pkg.name };
    }
    return null;
  }, [packages, selectedModuleName]);

  // Get module ABI
  const { data: moduleData } = useGetAccountModule(
    address,
    selectedModuleName || "",
  );

  // Auto-select first module if none selected
  useEffect(() => {
    if (!selectedModuleName && moduleNames.length > 0) {
      onModuleSelect(moduleNames[0]);
    }
  }, [selectedModuleName, moduleNames, onModuleSelect]);

  if (isLoading) {
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

  const entryFnCount =
    moduleData?.abi?.exposed_functions?.filter((fn) => fn.is_entry)?.length ||
    0;
  const viewFnCount =
    moduleData?.abi?.exposed_functions?.filter((fn) => fn.is_view)?.length || 0;
  const bytecodeSize = moduleData?.bytecode
    ? getBytecodeSizeInKB(moduleData.bytecode)
    : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar - Module List */}
      <div className="md:col-span-1">
        <Card className="h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Mobile: Select dropdown */}
            <div className="md:hidden">
              <Select value={selectedModuleName} onValueChange={onModuleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {moduleNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop: Button list */}
            <div className="hidden md:block space-y-1">
              {moduleNames.map((name) => (
                <Button
                  key={name}
                  variant={selectedModuleName === name ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-left font-mono text-xs"
                  onClick={() => onModuleSelect(name)}
                >
                  <FileCode className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="md:col-span-3 space-y-6">
        {selectedModuleName ? (
          <>
            {/* Module Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 font-mono">
                    <FileCode className="h-5 w-5" />
                    {selectedModuleName}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{entryFnCount} entry functions</span>
                    <span>{viewFnCount} view functions</span>
                    <span>Bytecode: {bytecodeSize} KB</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Source Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source Code</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedModuleWithSource?.source ? (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px]">
                    {selectedModuleWithSource.source}
                  </pre>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Source code not available.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ABI */}
            {moduleData?.abi && <AbiDisplay abi={moduleData.abi} />}
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Select a module to view its code
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
