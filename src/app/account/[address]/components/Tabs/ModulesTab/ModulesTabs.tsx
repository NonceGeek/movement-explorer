"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const router = useRouter();
  const packages = useGetAccountPackages(address);

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
    const tab = value as ModulesTabValue;
    setCurrentTab(tab);

    // Update URL
    const basePath = isObject ? "object" : "account";
    if (tab === "packages") {
      router.push(`/${basePath}/${address}/modules`);
    } else {
      router.push(
        `/${basePath}/${address}/modules/${tab}${selectedModuleName ? `/${selectedModuleName}` : ""}`,
      );
    }
  };

  const getModulePath = (
    moduleName: string,
    tab: ModulesTabValue = currentTab,
  ) => {
    const basePath = isObject ? "object" : "account";
    return `/${basePath}/${address}/modules/${tab}/${moduleName}`;
  };

  const handleModuleSelect = (moduleName: string) => {
    setSelectedModuleName(moduleName);
    if (currentTab !== "packages") {
      router.push(getModulePath(moduleName));
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          {(Object.keys(TAB_LABELS) as ModulesTabValue[]).map((tab) => (
            <TabsTrigger key={tab} value={tab} className="cursor-pointer">
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
