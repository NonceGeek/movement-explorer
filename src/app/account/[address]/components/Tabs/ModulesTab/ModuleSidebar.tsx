"use client";

import { useMemo, useState } from "react";
import { Types } from "aptos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Package as PackageIcon,
  FileCode,
} from "lucide-react";
import { cn } from "@/utils/styling";
import { PackageMetadata } from "@/hooks/accounts/useGetAccountPackages";

interface ModuleSidebarProps {
  modules: Types.MoveModuleBytecode[];
  packages?: PackageMetadata[];
  selectedModuleName?: string;
  selectedFnName?: string;
  onModuleSelect: (moduleName: string) => void;
  onFunctionSelect?: (moduleName: string, fnName: string) => void;
  filterFn?: (fn: Types.MoveFunction) => boolean;
  title?: string;
}

export default function ModuleSidebar({
  modules,
  packages,
  selectedModuleName,
  selectedFnName,
  onModuleSelect,
  onFunctionSelect,
  filterFn,
  title = "Select function",
}: ModuleSidebarProps) {
  // Group functions by module (from ABI data)
  const moduleAndFnsGroup = useMemo(() => {
    return modules.reduce(
      (acc, module) => {
        if (!module.abi) {
          return acc;
        }

        const fns = filterFn
          ? module.abi.exposed_functions.filter(filterFn)
          : module.abi.exposed_functions;

        if (fns.length === 0) {
          return acc;
        }

        const moduleName = module.abi.name;
        return {
          ...acc,
          [moduleName]: fns,
        } as Record<string, Types.MoveFunction[]>;
      },
      {} as Record<string, Types.MoveFunction[]>,
    );
  }, [modules, filterFn]);

  // Build package → modules tree structure
  const packageTree = useMemo(() => {
    if (!packages || packages.length === 0) return null;

    return packages
      .map((pkg) => {
        // Only include modules that have matching functions
        const modulesWithFns = pkg.modules
          .map((mod) => mod.name)
          .filter((name) => moduleAndFnsGroup[name]);
        return { name: pkg.name, moduleNames: modulesWithFns };
      })
      .filter((pkg) => pkg.moduleNames.length > 0);
  }, [packages, moduleAndFnsGroup]);

  const hasMultiplePackages = packageTree && packageTree.length > 1;

  const sortedModuleNames = Object.keys(moduleAndFnsGroup).sort();

  // Find which package a module belongs to
  const moduleToPackage = useMemo(() => {
    if (!packages) return {};
    const map: Record<string, string> = {};
    for (const pkg of packages) {
      for (const mod of pkg.modules) {
        map[mod.name] = pkg.name;
      }
    }
    return map;
  }, [packages]);

  // Track expanded state for packages and modules
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(() => {
    if (!hasMultiplePackages) return new Set();
    // Auto-expand the package containing the selected module
    if (selectedModuleName && moduleToPackage[selectedModuleName]) {
      return new Set([moduleToPackage[selectedModuleName]]);
    }
    return packageTree ? new Set([packageTree[0].name]) : new Set();
  });

  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () =>
      new Set(
        selectedModuleName
          ? [selectedModuleName]
          : sortedModuleNames.slice(0, 1),
      ),
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

  const toggleModule = (moduleName: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleName)) {
        next.delete(moduleName);
      } else {
        next.add(moduleName);
      }
      return next;
    });
  };

  // Mobile: flat options for Select
  const mobileOptions = sortedModuleNames.flatMap((moduleName) =>
    moduleAndFnsGroup[moduleName].map((fn) => ({
      value: `${moduleName}::${fn.name}`,
      label: hasMultiplePackages
        ? `${moduleToPackage[moduleName]} / ${moduleName} / ${fn.name}`
        : `${moduleName} / ${fn.name}`,
      moduleName,
      fnName: fn.name,
    })),
  );

  if (sortedModuleNames.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm rounded-xl border-border/50">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">No functions found</p>
        </CardContent>
      </Card>
    );
  }

  const renderModuleNode = (moduleName: string, indent?: boolean) => {
    const fns = moduleAndFnsGroup[moduleName];
    const isExpanded = expandedModules.has(moduleName);

    return (
      <div key={moduleName}>
        {/* Module header */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start text-left text-sm h-auto py-2 px-2 gap-1",
          )}
          onClick={() => {
            toggleModule(moduleName);
            onModuleSelect(moduleName);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          <FileCode className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium">{moduleName}</span>
          <span className="ml-auto text-muted-foreground text-xs">
            {fns.length}
          </span>
        </Button>

        {/* Function list (nested) */}
        {isExpanded && (
          <div className="ml-4 border-l border-border pl-2 space-y-0.5 mt-0.5">
            {fns.map((fn) => {
              const isFnSelected =
                moduleName === selectedModuleName &&
                fn.name === selectedFnName;
              return (
                <Button
                  key={fn.name}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-mono text-sm h-auto py-1.5 px-2",
                    isFnSelected &&
                      "bg-primary/10 text-primary border border-primary/20",
                  )}
                  onClick={() => {
                    onModuleSelect(moduleName);
                    onFunctionSelect?.(moduleName, fn.name);
                  }}
                >
                  <span className="truncate">{fn.name}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-fit max-h-[calc(100vh-200px)] overflow-y-auto bg-card/50 backdrop-blur-sm rounded-xl border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Mobile: Select dropdown */}
        <div className="md:hidden">
          <Select
            value={
              selectedModuleName && selectedFnName
                ? `${selectedModuleName}::${selectedFnName}`
                : undefined
            }
            onValueChange={(val) => {
              const opt = mobileOptions.find((o) => o.value === val);
              if (opt) {
                onModuleSelect(opt.moduleName);
                onFunctionSelect?.(opt.moduleName, opt.fnName);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a function" />
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
          {hasMultiplePackages
            ? // 3-level tree: Package → Module → Function
              packageTree.map((pkg) => {
                const isPkgExpanded = expandedPackages.has(pkg.name);
                return (
                  <div key={pkg.name}>
                    {/* Package header */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left text-sm h-auto py-2 px-2 gap-1"
                      onClick={() => togglePackage(pkg.name)}
                    >
                      {isPkgExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <PackageIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-medium">{pkg.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {pkg.moduleNames.length}
                      </span>
                    </Button>

                    {/* Modules under this package */}
                    {isPkgExpanded && (
                      <div className="ml-4 border-l border-border pl-2 space-y-0.5 mt-0.5">
                        {pkg.moduleNames.map((modName) =>
                          renderModuleNode(modName, true),
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            : // 2-level tree: Module → Function (single or no package)
              sortedModuleNames.map((moduleName) =>
                renderModuleNode(moduleName),
              )}
        </div>
      </CardContent>
    </Card>
  );
}
