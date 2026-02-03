"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
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
    <Card>
      <CardHeader>
        <CardTitle>Resources ({resources?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
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
                <p className="text-sm text-muted-foreground mb-2 font-mono break-all">
                  {resource.type}
                </p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-96">
                  {JSON.stringify(resource.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No resources found</p>
        )}
      </CardContent>
    </Card>
  );
}
