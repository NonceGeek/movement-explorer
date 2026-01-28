"use client";

import ModulesTabs from "./ModulesTabs";

interface ModulesTabProps {
  address: string;
  isObject?: boolean;
  initialTab?: string;
  initialPackage?: string;
  initialModule?: string;
  initialFunction?: string;
}

/**
 * Main entry point for the Modules tab.
 * Delegates to ModulesTabs which handles sub-tab navigation.
 */
export default function ModulesTab({
  address,
  isObject = false,
  initialTab,
  initialPackage,
  initialModule,
  initialFunction,
}: ModulesTabProps) {
  return (
    <ModulesTabs
      address={address}
      isObject={isObject}
      initialTab={initialTab}
      initialModule={initialModule}
      initialFunction={initialFunction}
    />
  );
}
