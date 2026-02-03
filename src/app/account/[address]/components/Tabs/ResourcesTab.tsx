"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { JsonViewer } from "@/components/ui/json-viewer";
import { Types } from "aptos";

interface ResourcesTabProps {
  resources: Types.MoveResource[] | undefined;
  isLoading: boolean;
}

export default function ResourcesTab({
  resources,
  isLoading,
}: ResourcesTabProps) {
  return (
    <>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <EnhancedSkeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : resources && resources.length > 0 ? (
        <div className="space-y-4">
          {resources.map((resource, i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <p className="text-base text-muted-foreground mb-2 break-all">
                {resource.type}
              </p>
              <JsonViewer data={resource.data} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No resources found</p>
      )}
    </>
  );
}
