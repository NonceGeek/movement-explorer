"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  FileCode,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/styling";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../..";
import { PackageMetadata } from "@/hooks/accounts/useGetAccountPackages";
import { useGetAccountModule } from "@/hooks/accounts/useGetAccountModule";
import { getBytecodeSizeInKB, transformCode } from "@/utils";
import AbiDisplay from "./AbiDisplay";
import PackageContent from "./PackageContent";

interface CodeTabProps {
  address: string;
  isObject?: boolean;
  packages: PackageMetadata[];
  packagesLoading: boolean;
  selectedModuleName?: string;
  onModuleSelect: (moduleName: string) => void;
}

export default function CodeTab({
  address,
  isObject = false,
  packages,
  packagesLoading,
  selectedModuleName,
  onModuleSelect,
}: CodeTabProps) {
  const [selectedPackageName, setSelectedPackageName] = useState<string>("");
  const [viewingModule, setViewingModule] = useState<string | null>(
    selectedModuleName || null,
  );
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(
    new Set(),
  );

  // Build flat module→package mapping
  const moduleToPackage = useMemo(() => {
    const map: Record<string, string> = {};
    for (const pkg of packages) {
      for (const mod of pkg.modules) {
        map[mod.name] = pkg.name;
      }
    }
    return map;
  }, [packages]);

  // Initialize: select first package & expand it
  useEffect(() => {
    if (packages.length > 0 && !selectedPackageName) {
      const firstPkg = packages[0].name;
      setSelectedPackageName(firstPkg);
      setExpandedPackages(new Set([firstPkg]));
    }
  }, [packages, selectedPackageName]);

  // If initialModule is provided, resolve its package and select it
  useEffect(() => {
    if (selectedModuleName && moduleToPackage[selectedModuleName]) {
      const pkgName = moduleToPackage[selectedModuleName];
      setSelectedPackageName(pkgName);
      setViewingModule(selectedModuleName);
      setExpandedPackages((prev) => new Set([...prev, pkgName]));
    }
  }, [selectedModuleName, moduleToPackage]);

  const selectedPackage = packages.find((p) => p.name === selectedPackageName);

  // Find the module and decode its source code
  const selectedModuleSource = useMemo(() => {
    if (!viewingModule) return null;
    for (const pkg of packages) {
      const mod = pkg.modules.find((m) => m.name === viewingModule);
      if (mod) {
        const decodedSource =
          mod.source && mod.source !== "0x" ? transformCode(mod.source) : "";
        return { ...mod, decodedSource, packageName: pkg.name };
      }
    }
    return null;
  }, [packages, viewingModule]);

  // Get module ABI data
  const { data: moduleData } = useGetAccountModule(
    address,
    viewingModule || "",
  );

  const togglePackage = (pkgName: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pkgName)) {
        next.delete(pkgName);
      } else {
        next.add(pkgName);
      }
      return next;
    });
  };

  const handlePackageClick = (pkgName: string) => {
    setSelectedPackageName(pkgName);
    setViewingModule(null);
    togglePackage(pkgName);
  };

  const handleModuleClick = (pkgName: string, moduleName: string) => {
    setSelectedPackageName(pkgName);
    setViewingModule(moduleName);
    onModuleSelect(moduleName);
  };

  // Module stats
  const entryFnCount =
    moduleData?.abi?.exposed_functions?.filter((fn) => fn.is_entry)?.length || 0;
  const viewFnCount =
    moduleData?.abi?.exposed_functions?.filter((fn) => fn.is_view)?.length || 0;
  const bytecodeSize = moduleData?.bytecode
    ? getBytecodeSizeInKB(moduleData.bytecode)
    : "0";

  if (packagesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <EnhancedSkeleton className="h-8 w-24 mb-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="md:col-span-3 space-y-4">
          <EnhancedSkeleton className="h-16 w-full" />
          <EnhancedSkeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <EmptyState
        icon={<FileCode className="h-12 w-12" />}
        title="No Modules Found"
        description="This account doesn't have any deployed modules."
      />
    );
  }

  // Mobile: build flat options for Select
  const mobileOptions = packages.flatMap((pkg) =>
    pkg.modules.map((mod) => ({
      value: `${pkg.name}::${mod.name}`,
      label: `${pkg.name} / ${mod.name}`,
      pkgName: pkg.name,
      modName: mod.name,
    })),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar - Tree Navigation */}
      <div className="md:col-span-1">
        <Card className="h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Packages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Mobile: Select dropdown */}
            <div className="md:hidden">
              <Select
                value={
                  viewingModule
                    ? `${moduleToPackage[viewingModule]}::${viewingModule}`
                    : undefined
                }
                onValueChange={(val) => {
                  const opt = mobileOptions.find((o) => o.value === val);
                  if (opt) {
                    handleModuleClick(opt.pkgName, opt.modName);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {mobileOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop: Tree view */}
            <div className="hidden md:block space-y-1">
              {packages.map((pkg) => {
                const isExpanded = expandedPackages.has(pkg.name);
                const isPkgSelected =
                  pkg.name === selectedPackageName && !viewingModule;
                return (
                  <div key={pkg.name}>
                    {/* Package header */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left text-xs h-auto py-2 px-2 gap-1",
                        isPkgSelected &&
                          "bg-primary/10 text-primary border border-primary/20",
                      )}
                      onClick={() => handlePackageClick(pkg.name)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0" />
                      )}
                      <Package className="h-3 w-3 shrink-0" />
                      <span className="truncate font-medium">{pkg.name}</span>
                      <span className="ml-auto text-muted-foreground text-[10px]">
                        {pkg.modules.length}
                      </span>
                    </Button>

                    {/* Module list (nested) */}
                    {isExpanded && (
                      <div className="ml-4 border-l border-border pl-2 space-y-0.5 mt-0.5">
                        {pkg.modules.map((mod) => {
                          const isModSelected = viewingModule === mod.name;
                          return (
                            <Button
                              key={mod.name}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-left font-mono text-xs h-auto py-1.5 px-2",
                                isModSelected &&
                                  "bg-primary/10 text-primary border border-primary/20",
                              )}
                              onClick={() =>
                                handleModuleClick(pkg.name, mod.name)
                              }
                            >
                              <FileCode className="h-3 w-3 mr-1.5 shrink-0" />
                              <span className="truncate">{mod.name}</span>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="md:col-span-3 space-y-6">
        {viewingModule && selectedModuleSource ? (
          <>
            {/* Module Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 font-mono">
                    <FileCode className="h-5 w-5" />
                    {viewingModule}
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
                {selectedModuleSource.decodedSource ? (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px]">
                    {selectedModuleSource.decodedSource}
                  </pre>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>
                      Unfortunately, the source code cannot be shown because the
                      package publisher has chosen not to make it available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ABI */}
            {moduleData?.abi && <AbiDisplay abi={moduleData.abi} />}
          </>
        ) : selectedPackage ? (
          <PackageContent
            address={address}
            packageMetadata={selectedPackage}
            onModuleSelect={(moduleName) =>
              handleModuleClick(selectedPackage.name, moduleName)
            }
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Select a package or module from the sidebar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
