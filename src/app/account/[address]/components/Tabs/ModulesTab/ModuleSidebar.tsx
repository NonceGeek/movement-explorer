"use client";

import { useMemo } from "react";
import { Types } from "aptos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModuleSidebarProps {
  modules: Types.MoveModuleBytecode[];
  selectedModuleName?: string;
  selectedFnName?: string;
  onModuleSelect: (moduleName: string) => void;
  onFunctionSelect?: (moduleName: string, fnName: string) => void;
  filterFn?: (fn: Types.MoveFunction) => boolean;
  title?: string;
}

export default function ModuleSidebar({
  modules,
  selectedModuleName,
  selectedFnName,
  onModuleSelect,
  onFunctionSelect,
  filterFn,
  title = "Select function",
}: ModuleSidebarProps) {
  // Group functions by module
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

  const sortedModuleNames = Object.keys(moduleAndFnsGroup).sort();

  if (sortedModuleNames.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">No functions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedModuleNames.map((moduleName) => {
          const fns = moduleAndFnsGroup[moduleName];
          return (
            <div key={moduleName} className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                {moduleName}
              </p>
              <div className="space-y-1">
                {fns.map((fn) => {
                  const isSelected =
                    moduleName === selectedModuleName &&
                    fn.name === selectedFnName;
                  return (
                    <Button
                      key={fn.name}
                      variant={isSelected ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-mono text-xs h-auto py-1.5 px-2",
                        isSelected && "bg-primary/10 border border-primary/20",
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
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
