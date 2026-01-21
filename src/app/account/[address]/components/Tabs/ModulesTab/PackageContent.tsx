import { PackageMetadata } from "@/hooks/accounts/useGetAccountPackages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";

interface PackageContentProps {
  address: string;
  packageMetadata: PackageMetadata;
}

function getUpgradePolicyLabel(policy: number) {
  switch (policy) {
    case 0:
      return "Arbitrary";
    case 1:
      return "Compatible";
    case 2:
      return "Immutable";
    default:
      return "Unknown";
  }
}

export default function PackageContent({
  address,
  packageMetadata,
}: PackageContentProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-xl font-bold font-mono break-all text-primary">
                {packageMetadata.name}
              </CardTitle>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Address:</span>
                <CopyableAddress address={address} showCopyButton />
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">v{packageMetadata.upgrade_number}</Badge>
              <Badge variant="secondary">
                {getUpgradePolicyLabel(packageMetadata.upgrade_policy.policy)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground">
                Source Digest
              </span>
              <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                {packageMetadata.source_digest}
              </p>
            </div>
            {/* Add more metadata if needed */}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Modules ({packageMetadata.modules.length})
        </h3>
        <div className="grid gap-3">
          {packageMetadata.modules.map((module) => (
            <Card key={module.name} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium font-mono text-sm">
                    {module.name}
                  </h4>
                </div>
                {/*
                    If we want to show source code, we could add a collapsible or a link to a separate view.
                    For now just listing them.
                  */}
                <div className="max-h-32 overflow-y-auto bg-muted/50 p-2 rounded text-xs font-mono text-muted-foreground">
                  {/* Just a preview or empty state if source is too large */}
                  {module.source ? "Source available" : "Bytecode only"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
