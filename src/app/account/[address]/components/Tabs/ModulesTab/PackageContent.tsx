import { PackageMetadata } from "@/hooks/accounts/useGetAccountPackages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { FileCode } from "lucide-react";
import MovePackageManifest from "./MovePackageManifest";

interface PackageContentProps {
  address: string;
  packageMetadata: PackageMetadata;
  onModuleSelect: (moduleName: string) => void;
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
  onModuleSelect,
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
          </div>
        </CardContent>
      </Card>

      {packageMetadata.manifest && (
        <MovePackageManifest manifest={packageMetadata.manifest} />
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Modules ({packageMetadata.modules.length})
        </h3>
        <div className="grid gap-3">
          {packageMetadata.modules.map((module) => (
            <Card
              key={module.name}
              className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onModuleSelect(module.name)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium font-mono text-sm flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    {module.name}
                  </h4>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
