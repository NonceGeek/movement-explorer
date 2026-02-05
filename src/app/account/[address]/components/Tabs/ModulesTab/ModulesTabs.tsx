"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../..";
import { Code } from "lucide-react";
import ViewCode from "./ViewCode";
import ReadContract from "./ReadContract";
import RunContract from "./RunContract";
import PackageContent from "./PackageContent";
import PackagesSidebar from "./PackagesSidebar";
import { useGetAccountPackages } from "@/hooks/accounts/useGetAccountPackages";

type ModulesTabValue = "packages" | "code" | "view" | "run";

const TAB_LABELS: Record<ModulesTabValue, string> = {
  packages: "Packages",
  code: "Code",
  view: "View",
  run: "Run",
};

interface ModulesTabsProps {
  address: string;
  isObject?: boolean;
  initialTab?: string;
  initialModule?: string;
  initialFunction?: string;
}

export default function ModulesTabs({
  address,
  isObject = false,
  initialTab,
  initialModule,
  initialFunction,
}: ModulesTabsProps) {
  const { packages, isLoading: packagesLoading } =
    useGetAccountPackages(address);

  // Determine initial tab from slug
  const getInitialTab = (): ModulesTabValue => {
    if (initialTab && initialTab in TAB_LABELS) {
      return initialTab as ModulesTabValue;
    }
    return "packages";
  };

  const [currentTab, setCurrentTab] =
    useState<ModulesTabValue>(getInitialTab());
  const [selectedPackageName, setSelectedPackageName] = useState<string>("");
  const [selectedModuleName, setSelectedModuleName] = useState<string>(
    initialModule || "",
  );

  // Initialize selected package
  useEffect(() => {
    if (!selectedPackageName && packages.length > 0) {
      setSelectedPackageName(packages[0].name);
    }
  }, [packages, selectedPackageName]);

  const selectedPackage = packages.find((p) => p.name === selectedPackageName);

  const handleTabChange = (value: string) => {
    // Save current scroll position
    const scrollY = window.scrollY;

    const tab = value as ModulesTabValue;
    setCurrentTab(tab);

    // Update URL without scrolling
    const basePath = isObject ? "object" : "account";
    let newPath: string;
    if (tab === "packages") {
      newPath = `/${basePath}/${address}/modules`;
    } else {
      newPath = `/${basePath}/${address}/modules/${tab}${selectedModuleName ? `/${selectedModuleName}` : ""}`;
    }

    // Use window.history.pushState to avoid Next.js navigation behavior
    window.history.pushState(null, '', newPath);

    // Restore scroll position after DOM update
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  const getModulePath = (
    moduleName: string,
    tab: ModulesTabValue = currentTab,
  ) => {
    const basePath = isObject ? "object" : "account";
    return `/${basePath}/${address}/modules/${tab}/${moduleName}`;
  };

  const handleModuleSelect = (moduleName: string) => {
    // Save current scroll position
    const scrollY = window.scrollY;

    setSelectedModuleName(moduleName);
    if (currentTab !== "packages") {
      const newPath = getModulePath(moduleName);

      // Use window.history.pushState to avoid Next.js navigation behavior
      window.history.pushState(null, '', newPath);

      // Restore scroll position after DOM update
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  };

  if (packagesLoading) {
    return (
      <div className="space-y-6">
        {/* Tab bar skeleton */}
        <div className="flex gap-4 border-b border-border pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        {/* Content skeleton: sidebar + main */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <EnhancedSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="md:col-span-3 space-y-4">
            <EnhancedSkeleton className="h-24 w-full" />
            <EnhancedSkeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <EmptyState
        icon={<Code className="h-12 w-12" />}
        title="No Modules Found"
        description="This account doesn't have any deployed modules."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList variant="line" className="w-full">
          {(Object.keys(TAB_LABELS) as ModulesTabValue[]).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              variant="line"
              className="cursor-pointer"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="packages" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <PackagesSidebar
                packages={packages}
                selectedPackageName={selectedPackageName}
                onSelectPackage={setSelectedPackageName}
              />
            </div>
            <div className="md:col-span-3">
              {selectedPackage && (
                <PackageContent
                  address={address}
                  packageMetadata={selectedPackage}
                  initialModule={initialModule}
                  initialFunction={initialFunction}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="mt-6">
          <ViewCode
            address={address}
            isObject={isObject}
            selectedModuleName={selectedModuleName}
            onModuleSelect={handleModuleSelect}
          />
        </TabsContent>

        <TabsContent value="view" className="mt-6">
          <ReadContract
            address={address}
            isObject={isObject}
            selectedModuleName={selectedModuleName}
            selectedFnName={initialFunction}
            onModuleSelect={handleModuleSelect}
          />
        </TabsContent>

        <TabsContent value="run" className="mt-6">
          <RunContract
            address={address}
            isObject={isObject}
            selectedModuleName={selectedModuleName}
            selectedFnName={initialFunction}
            onModuleSelect={handleModuleSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
