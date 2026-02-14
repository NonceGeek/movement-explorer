"use client";

import { useState } from "react";
import { Tabs, TabsContent, PillTabsList } from "@/components/ui/tabs";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../..";
import { Code } from "lucide-react";
import ReadContract from "./ReadContract";
import RunContract from "./RunContract";
import CodeTab from "./CodeTab";
import { useGetAccountPackages } from "@/hooks/accounts/useGetAccountPackages";

type ModulesTabValue = "code" | "read" | "write";

const TAB_LABELS: Record<ModulesTabValue, string> = {
  code: "Code",
  read: "Read",
  write: "Write",
};

// Map old tab names to new ones for backward compatibility
const TAB_COMPAT: Record<string, ModulesTabValue> = {
  packages: "code",
  code: "code",
  view: "read",
  read: "read",
  run: "write",
  write: "write",
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

  // Resolve initial tab with backward compatibility
  const getInitialTab = (): ModulesTabValue => {
    if (initialTab) {
      return TAB_COMPAT[initialTab] || "code";
    }
    return "code";
  };

  const [currentTab, setCurrentTab] =
    useState<ModulesTabValue>(getInitialTab());
  const [selectedModuleName, setSelectedModuleName] = useState<string>(
    initialModule || "",
  );

  const handleTabChange = (value: string) => {
    const scrollY = window.scrollY;

    const tab = value as ModulesTabValue;
    setCurrentTab(tab);

    const basePath = isObject ? "object" : "account";
    const newPath =
      tab === "code" && !selectedModuleName
        ? `/${basePath}/${address}/modules`
        : `/${basePath}/${address}/modules/${tab}${selectedModuleName ? `/${selectedModuleName}` : ""}`;

    window.history.pushState(null, "", newPath);

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  const handleModuleSelect = (moduleName: string) => {
    const scrollY = window.scrollY;

    setSelectedModuleName(moduleName);
    const basePath = isObject ? "object" : "account";
    const newPath = `/${basePath}/${address}/modules/${currentTab}/${moduleName}`;

    window.history.pushState(null, "", newPath);

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  if (packagesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 border-b border-border pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-8 w-20" />
          ))}
        </div>
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
    <div className="space-y-4">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <PillTabsList
          items={(Object.keys(TAB_LABELS) as ModulesTabValue[]).map((tab) => ({
            value: tab,
            label: TAB_LABELS[tab],
          }))}
          activeTab={currentTab}
          onTabChange={handleTabChange}
        />

        <TabsContent value="code" className="mt-2">
          <CodeTab
            address={address}
            isObject={isObject}
            packages={packages}
            packagesLoading={packagesLoading}
            selectedModuleName={selectedModuleName}
            onModuleSelect={handleModuleSelect}
          />
        </TabsContent>

        <TabsContent value="read" className="mt-2">
          <ReadContract
            address={address}
            isObject={isObject}
            selectedModuleName={selectedModuleName}
            selectedFnName={initialFunction}
            onModuleSelect={handleModuleSelect}
          />
        </TabsContent>

        <TabsContent value="write" className="mt-2">
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
