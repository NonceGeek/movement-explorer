"use client";

import { useState, useEffect } from "react";
import { useGetAccountPackages } from "@/hooks/accounts/useGetAccountPackages";
import { Card, CardContent } from "@/components/ui/card";
import PackagesSidebar from "./PackagesSidebar";
import PackageContent from "./PackageContent";

interface ModulesTabProps {
  address: string;
}

export default function ModulesTab({ address }: ModulesTabProps) {
  const packages = useGetAccountPackages(address);
  const [selectedPackageName, setSelectedPackageName] = useState<string>("");

  useEffect(() => {
    if (!selectedPackageName && packages.length > 0) {
      setSelectedPackageName(packages[0].name);
    }
  }, [packages, selectedPackageName]);

  if (packages.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No modules found</p>
        </CardContent>
      </Card>
    );
  }

  const selectedPackage = packages.find((p) => p.name === selectedPackageName);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <PackagesSidebar
          packages={packages}
          selectedPackageName={selectedPackageName}
          onSelectPackage={setSelectedPackageName}
        />
      </div>
      <div className="md:col-span-3">
        {selectedPackage ? (
          <PackageContent address={address} packageMetadata={selectedPackage} />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Select a package to view details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
