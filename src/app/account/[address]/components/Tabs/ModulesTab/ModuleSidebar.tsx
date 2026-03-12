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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronRight,
  Package as PackageIcon,
  FileCode,
  LayoutList,
} from "lucide-react";
import { cn } from "@/utils/styling";
import { transformCode } from "@/utils";
import { MOVE_FN_REGEX } from "@/utils/moveSourceParser";
import { PackageMetadata } from "@/hooks/accounts/useGetAccountPackages";

interface ModuleSidebarProps {
  modules: Types.MoveModuleBytecode[];
  packages?: PackageMetadata[];
  selectedModuleName?: string;
  selectedFnName?: string;
  onModuleSelect: (moduleName: string) => void;
  onFunctionSelect?: (moduleName: string, fnName: string) => void;
  onPackageOverview?: (packageName: string) => void;
  isOverviewSelected?: boolean;
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
  onPackageOverview,
  isOverviewSelected,
  filterFn,
  title = "Select function",
}: ModuleSidebarProps) {

  // Build source code function order map for sorting
  const sourceFnOrder = useMemo(() => {
    const orderMap: Record<string, Map<string, number>> = {};
    if (!packages) return orderMap;
    for (const pkg of packages) {
      for (const mod of pkg.modules) {
        if (mod.source && mod.source !== "0x") {
          const source = transformCode(mod.source);
          const order = new Map<string, number>();
          const lines = source.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(MOVE_FN_REGEX);
            if (match) order.set(match[1], i);
          }
          orderMap[mod.name] = order;
        }
      }
    }
    return orderMap;
  }, [packages]);

  const moduleAndFnsGroup = useMemo(() => {
    return modules.reduce(
      (acc, module) => {
        if (!module.abi) return acc;
        let fns = filterFn
          ? module.abi.exposed_functions.filter(filterFn)
          : [...module.abi.exposed_functions];
        if (fns.length === 0) return acc;
        const order = sourceFnOrder[module.abi.name];
        if (order) {
          fns = [...fns].sort((a, b) => {
            return (order.get(a.name) ?? Infinity) - (order.get(b.name) ?? Infinity);
          });
        }
        return { ...acc, [module.abi.name]: fns } as Record<
          string,
          Types.MoveFunction[]
        >;
      },
      {} as Record<string, Types.MoveFunction[]>,
    );
  }, [modules, filterFn, sourceFnOrder]);

  const packageTree = useMemo(() => {
    if (!packages || packages.length === 0) return null;
    return packages
      .map((pkg) => ({
        name: pkg.name,
        moduleNames: pkg.modules
          .map((m) => m.name)
          .filter((n) => moduleAndFnsGroup[n]),
      }))
      .filter((pkg) => pkg.moduleNames.length > 0);
  }, [packages, moduleAndFnsGroup]);

  const hasPackages = packageTree && packageTree.length > 0;
  const sortedModuleNames = Object.keys(moduleAndFnsGroup).sort();

  const moduleToPackage = useMemo(() => {
    if (!packages) return {};
    const map: Record<string, string> = {};
    for (const pkg of packages)
      for (const mod of pkg.modules) map[mod.name] = pkg.name;
    return map;
  }, [packages]);

  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(() => {
    if (!hasPackages) return new Set();
    if (selectedModuleName && moduleToPackage[selectedModuleName])
      return new Set([moduleToPackage[selectedModuleName]]);
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

  const togglePackage = (pkgName: string) =>
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      next.has(pkgName) ? next.delete(pkgName) : next.add(pkgName);
      return next;
    });

  const toggleModule = (moduleName: string) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(moduleName) ? next.delete(moduleName) : next.add(moduleName);
      return next;
    });

  const mobileOptions = sortedModuleNames.flatMap((moduleName) =>
    moduleAndFnsGroup[moduleName].map((fn) => ({
      value: `${moduleName}::${fn.name}`,
      label: hasPackages
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

  const chevronIcon = (expanded: boolean) =>
    expanded ? (
      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
    ) : (
      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
    );

  // Unified module node — same visual style for both Code tab and Read/Write
  const renderModuleNode = (moduleName: string) => {
    const fns = moduleAndFnsGroup[moduleName];
    const isExpanded = expandedModules.has(moduleName);
    const isModuleSelected = moduleName === selectedModuleName;

    return (
      <div key={moduleName}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-left text-sm h-auto py-2 px-2 gap-1",
                isModuleSelected &&
                  "bg-primary/10 text-primary border border-primary/20",
              )}
              onClick={() => {
                toggleModule(moduleName);
                onModuleSelect(moduleName);
              }}
            >
              {chevronIcon(isExpanded)}
              <FileCode className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-medium">{moduleName}</span>
              <span className="ml-auto text-muted-foreground text-xs">
                {fns.length}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-mono text-xs">
            {moduleName}
          </TooltipContent>
        </Tooltip>

        {isExpanded && (
          <div className="ml-4 border-l border-border pl-2 space-y-0.5 mt-0.5">
            {fns.map((fn) => {
              const isFnSelected =
                moduleName === selectedModuleName && fn.name === selectedFnName;
              return (
                <Tooltip key={fn.name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-mono text-sm h-auto py-1.5 px-2",
                        isFnSelected &&
                          "bg-primary/10 text-primary border border-primary/20",
                      )}
                      onClick={() => {
                        if (onFunctionSelect) {
                          onFunctionSelect(moduleName, fn.name);
                        } else {
                          onModuleSelect(moduleName);
                        }
                      }}
                    >
                      <span className="truncate">{fn.name}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-mono text-xs">
                    {fn.name}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-fit max-h-[calc(100vh-140px)] overflow-y-auto bg-card/50 backdrop-blur-sm rounded-xl border-border/50">
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
        <TooltipProvider delayDuration={400}>
          <div className="hidden md:block space-y-1">
            {hasPackages
              ? packageTree.map((pkg) => {
                  const isPkgExpanded = expandedPackages.has(pkg.name);
                  return (
                    <div key={pkg.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left text-sm h-auto py-2 px-2 gap-1"
                            onClick={() => togglePackage(pkg.name)}
                          >
                            {chevronIcon(isPkgExpanded)}
                            <PackageIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate font-medium">
                              {pkg.name}
                            </span>
                            <span className="ml-auto text-muted-foreground text-xs">
                              {pkg.moduleNames.length}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="font-mono text-xs"
                        >
                          {pkg.name}
                        </TooltipContent>
                      </Tooltip>

                      {isPkgExpanded && (
                        <div className="ml-4 border-l border-border pl-2 space-y-0.5 mt-0.5">
                          {onPackageOverview && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-left text-sm h-auto py-1.5 px-2 gap-1",
                                isOverviewSelected &&
                                  !selectedModuleName &&
                                  "bg-primary/10 text-primary border border-primary/20",
                              )}
                              onClick={() => onPackageOverview(pkg.name)}
                            >
                              <LayoutList className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate font-medium">
                                Overview
                              </span>
                            </Button>
                          )}
                          {pkg.moduleNames.map((modName) =>
                            renderModuleNode(modName),
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              : sortedModuleNames.map((moduleName) =>
                  renderModuleNode(moduleName),
                )}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
