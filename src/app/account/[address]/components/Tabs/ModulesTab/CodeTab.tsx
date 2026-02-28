"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  FileCode,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  List,
  Braces,
  Hash,
  PanelLeftOpen,
} from "lucide-react";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../..";
import { PackageMetadata } from "@/hooks/accounts/useGetAccountPackages";
import { useGetAccountModule } from "@/hooks/accounts/useGetAccountModule";
import { useGetAccountModules } from "@/hooks/accounts/useGetAccountModules";
import { getBytecodeSizeInKB, transformCode } from "@/utils";
import { CodeBlock } from "@/components/ui/CodeBlock";
import AbiDisplay from "./AbiDisplay";
import PackageContent from "./PackageContent";
import ModuleSidebar from "./ModuleSidebar";
import { useModuleUIStore } from "@/store/useModuleUIStore";

const PACKAGE_OVERVIEW = "__package_overview__";
const LINE_ANCHOR_PREFIX = "source-code";

interface OutlineItem {
  type: "struct" | "function" | "const";
  name: string;
  line: number;
}

function parseOutline(code: string): OutlineItem[] {
  const lines = code.split("\n");
  const items: OutlineItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fnMatch = line.match(
      /^\s*(?:public\s+)?(?:\(friend\)\s+)?(?:entry\s+)?fun\s+(\w+)/,
    );
    if (fnMatch) {
      items.push({ type: "function", name: fnMatch[1], line: i + 1 });
      continue;
    }
    const structMatch = line.match(/^\s*(?:public\s+)?struct\s+(\w+)/);
    if (structMatch) {
      items.push({ type: "struct", name: structMatch[1], line: i + 1 });
      continue;
    }
    const constMatch = line.match(/^\s*const\s+(\w+)/);
    if (constMatch) {
      items.push({ type: "const", name: constMatch[1], line: i + 1 });
    }
  }
  return items;
}

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
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const { codeSidebarOpen, setCodeSidebarOpen } = useModuleUIStore();
  const toggleSidebar = () => setCodeSidebarOpen(!codeSidebarOpen);
  const [pendingScrollFn, setPendingScrollFn] = useState<string | null>(null);

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

  // Initialize: select first package
  useEffect(() => {
    if (packages.length > 0 && !selectedPackageName) {
      setSelectedPackageName(packages[0].name);
    }
  }, [packages, selectedPackageName]);

  // If initialModule is provided, resolve its package and select it
  useEffect(() => {
    if (selectedModuleName && moduleToPackage[selectedModuleName]) {
      const pkgName = moduleToPackage[selectedModuleName];
      setSelectedPackageName(pkgName);
      setViewingModule(selectedModuleName);
    }
  }, [selectedModuleName, moduleToPackage]);

  const selectedPackage = packages.find((p) => p.name === selectedPackageName);

  // All modules with ABI for sidebar function navigation
  const { data: allModules = [] } = useGetAccountModules(address);

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

  // Outline items
  const outlineItems = useMemo(() => {
    if (!selectedModuleSource?.decodedSource) return [];
    return parseOutline(selectedModuleSource.decodedSource);
  }, [selectedModuleSource?.decodedSource]);

  const handlePackageChange = (pkgName: string) => {
    setSelectedPackageName(pkgName);
    setViewingModule(null);
  };

  const handleModuleChange = (value: string) => {
    if (value === PACKAGE_OVERVIEW) {
      setViewingModule(null);
      return;
    }
    setViewingModule(value);
    onModuleSelect(value);
  };

  const handleCopy = useCallback(async () => {
    if (!selectedModuleSource?.decodedSource) return;
    await navigator.clipboard.writeText(selectedModuleSource.decodedSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedModuleSource?.decodedSource]);

  const handleOutlineClick = useCallback((line: number) => {
    const el = document.getElementById(`${LINE_ANCHOR_PREFIX}-line-${line}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Highlight effect
      el.style.transition = "none";
      el.style.backgroundColor = "rgba(59,130,246,0.35)";
      el.style.boxShadow = "inset 3px 0 0 0 rgba(59,130,246,0.8)";
      el.style.borderRadius = "2px";
      setTimeout(() => {
        el.style.transition =
          "background-color 1s ease-out, box-shadow 1s ease-out";
        el.style.backgroundColor = "";
        el.style.boxShadow = "";
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (pendingScrollFn && outlineItems.length > 0) {
      const item = outlineItems.find((i) => i.name === pendingScrollFn);
      if (item) {
        setPendingScrollFn(null);
        // Delay slightly to allow shiki to finish async HTML rendering before scrolling
        setTimeout(() => handleOutlineClick(item.line), 350);
      }
    }
  }, [pendingScrollFn, outlineItems, handleOutlineClick]);

  const handleSidebarFunctionSelect = useCallback(
    (moduleName: string, fnName: string) => {
      if (moduleName !== viewingModule) {
        handleModuleChange(moduleName);
        setPendingScrollFn(fnName);
      } else {
        const item = outlineItems.find((i) => i.name === fnName);
        if (item) handleOutlineClick(item.line);
      }
    },
    [viewingModule, outlineItems, handleModuleChange, handleOutlineClick],
  );

  // Module stats
  const entryFnCount =
    moduleData?.abi?.exposed_functions?.filter((fn) => fn.is_entry)?.length ||
    0;
  const viewFnCount =
    moduleData?.abi?.exposed_functions?.filter((fn) => fn.is_view)?.length || 0;
  const bytecodeSize = moduleData?.bytecode
    ? getBytecodeSizeInKB(moduleData.bytecode)
    : "0";

  if (packagesLoading) {
    return (
      <div className="space-y-4">
        <EnhancedSkeleton className="h-14 w-full rounded-lg" />
        <EnhancedSkeleton className="h-16 w-full rounded-lg" />
        <EnhancedSkeleton className="h-64 w-full rounded-lg" />
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

  const structs = outlineItems.filter((i) => i.type === "struct");
  const functions = outlineItems.filter((i) => i.type === "function");
  const constants = outlineItems.filter((i) => i.type === "const");

  return (
    <div className="space-y-2">
      {/* Header Navigation Bar */}
      <Card className="bg-card/50 backdrop-blur-sm rounded-xl border-border/50 py-0!">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sidebar open button — desktop only, when sidebar is closed */}
            {!codeSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex h-8 w-8 shrink-0"
                onClick={toggleSidebar}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}

            {/* Breadcrumb — desktop when sidebar open */}
            {codeSidebarOpen && (
              <div className="hidden md:flex items-center gap-1.5">
                {packages.length > 1 && (
                  <>
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-sm font-medium">
                      {selectedPackageName}
                    </span>
                    <span className="text-muted-foreground/40">/</span>
                  </>
                )}
                <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-sm font-medium">
                  {viewingModule || selectedPackageName}
                </span>
              </div>
            )}

            {/* Select dropdowns — mobile always; desktop when sidebar closed */}
            <div
              className={
                codeSidebarOpen
                  ? "md:hidden flex flex-wrap items-center gap-3"
                  : "flex flex-wrap items-center gap-3"
              }
            >
              {/* Package selector */}
              {packages.length > 1 ? (
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select
                    value={selectedPackageName}
                    onValueChange={handlePackageChange}
                  >
                    <SelectTrigger
                      variant="ghost"
                      size="sm"
                      className="h-8 min-w-[120px] cursor-pointer"
                    >
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.name} value={pkg.name}>
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-sm">{pkg.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {pkg.modules.length} modules
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-mono font-medium">
                    {selectedPackageName}
                  </span>
                </div>
              )}

              {/* Separator */}
              {selectedPackage && (
                <span className="text-muted-foreground/40 hidden sm:inline">
                  /
                </span>
              )}

              {/* Module selector */}
              {selectedPackage && (
                <div className="flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select
                    value={viewingModule || PACKAGE_OVERVIEW}
                    onValueChange={handleModuleChange}
                  >
                    <SelectTrigger
                      variant="ghost"
                      size="sm"
                      className="h-8 min-w-[140px] cursor-pointer"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PACKAGE_OVERVIEW}>
                        Package Overview
                      </SelectItem>
                      {selectedPackage.modules.map((mod) => (
                        <SelectItem key={mod.name} value={mod.name}>
                          <span className="font-mono text-sm">{mod.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Stats */}
            {viewingModule && (
              <div className="flex items-center gap-3 ml-auto text-sm text-muted-foreground">
                <span>{entryFnCount} entry</span>
                <span className="text-muted-foreground/30">|</span>
                <span>{viewFnCount} view</span>
                <span className="text-muted-foreground/30">|</span>
                <span>{bytecodeSize} KB</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Body: sidebar + content area — same grid as Read/Write tabs */}
      <div
        className={
          codeSidebarOpen && allModules.length > 0
            ? "grid grid-cols-1 md:grid-cols-4 gap-4 items-start"
            : ""
        }
      >
        {/* Sidebar — desktop only, col-span-1 */}
        {codeSidebarOpen && allModules.length > 0 && (
          <div className="hidden md:block md:col-span-1">
            <ModuleSidebar
              modules={allModules}
              packages={packages}
              selectedModuleName={viewingModule || ""}
              onModuleSelect={handleModuleChange}
              onFunctionSelect={handleSidebarFunctionSelect}
              packageName={selectedPackageName}
              onPackageSelect={() => handleModuleChange(PACKAGE_OVERVIEW)}
              isPackageSelected={!viewingModule}
              onCollapse={toggleSidebar}
            />
          </div>
        )}

        {/* Content Area */}
        <div
          className={
            codeSidebarOpen && allModules.length > 0
              ? "md:col-span-3 min-w-0 space-y-2"
              : "min-w-0 space-y-2"
          }
        >
          {viewingModule && selectedModuleSource ? (
        <>
          {/* Source Code */}
          <Card className="bg-card/50 backdrop-blur-sm rounded-xl border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Source Code</CardTitle>
                {selectedModuleSource.decodedSource && (
                  <div className="flex items-center gap-1">
                    {/* Outline */}
                    {outlineItems.length > 0 && (
                      <DropdownMenu>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                >
                                  <List className="h-4 w-4" />
                                  <span className="ml-1 text-xs hidden sm:inline">
                                    Outline
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Jump to definition</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuContent
                          align="end"
                          className="max-h-80 overflow-y-auto w-56"
                        >
                          {structs.length > 0 && (
                            <>
                              <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Structs
                              </DropdownMenuLabel>
                              {structs.map((item) => (
                                <DropdownMenuItem
                                  key={`struct-${item.line}`}
                                  onClick={() => handleOutlineClick(item.line)}
                                  className="cursor-pointer"
                                >
                                  <Braces className="h-3.5 w-3.5 mr-2 shrink-0 text-blue-500" />
                                  <span className="font-mono text-sm truncate">
                                    {item.name}
                                  </span>
                                  <span className="ml-auto text-xs text-muted-foreground pl-2">
                                    :{item.line}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                              {(functions.length > 0 || constants.length > 0) && (
                                <DropdownMenuSeparator />
                              )}
                            </>
                          )}
                          {functions.length > 0 && (
                            <>
                              <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Functions
                              </DropdownMenuLabel>
                              {functions.map((item) => (
                                <DropdownMenuItem
                                  key={`fn-${item.line}`}
                                  onClick={() => handleOutlineClick(item.line)}
                                  className="cursor-pointer"
                                >
                                  <FileCode className="h-3.5 w-3.5 mr-2 shrink-0 text-purple-500" />
                                  <span className="font-mono text-sm truncate">
                                    {item.name}
                                  </span>
                                  <span className="ml-auto text-xs text-muted-foreground pl-2">
                                    :{item.line}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                              {constants.length > 0 && (
                                <DropdownMenuSeparator />
                              )}
                            </>
                          )}
                          {constants.length > 0 && (
                            <>
                              <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Constants
                              </DropdownMenuLabel>
                              {constants.map((item) => (
                                <DropdownMenuItem
                                  key={`const-${item.line}`}
                                  onClick={() => handleOutlineClick(item.line)}
                                  className="cursor-pointer"
                                >
                                  <Hash className="h-3.5 w-3.5 mr-2 shrink-0 text-orange-500" />
                                  <span className="font-mono text-sm truncate">
                                    {item.name}
                                  </span>
                                  <span className="ml-auto text-xs text-muted-foreground pl-2">
                                    :{item.line}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Copy */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-8 px-2"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span className="ml-1 text-xs hidden sm:inline">
                              {copied ? "Copied" : "Copy"}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copied ? "Code copied!" : "Copy source code"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Expand / Collapse */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(!expanded)}
                      className="h-8 px-2"
                    >
                      {expanded ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                      <span className="ml-1 text-xs hidden sm:inline">
                        {expanded ? "Collapse" : "Expand"}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedModuleSource.decodedSource ? (
                <CodeBlock
                  ref={codeBlockRef}
                  code={selectedModuleSource.decodedSource}
                  lineAnchorPrefix={LINE_ANCHOR_PREFIX}
                  maxHeight={expanded ? "none" : "500px"}
                />
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
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
