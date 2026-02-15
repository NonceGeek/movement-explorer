import { PackageMetadata } from "@/hooks/accounts/useGetAccountPackages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import MovePackageManifest from "./MovePackageManifest";

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
    <div className="space-y-3">
      <Card className="bg-card/50 backdrop-blur-sm rounded-xl border-border/50">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-xl font-bold font-mono break-all text-primary">
                {packageMetadata.name}
              </CardTitle>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Address:</span>
                <CopyableAddress address={address} showCopyButton showFull />
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
          <div className="flex gap-4 text-sm">
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground">
                Source Digest
              </span>

              <CopyableAddress
                address={packageMetadata.source_digest}
                showCopyButton
                copyTooltip="Copy source digest"
                showFull
              />

            </div>
          </div>
        </CardContent>
      </Card>

      {packageMetadata.manifest && (
        <MovePackageManifest manifest={packageMetadata.manifest} />
      )}
    </div>
  );
}
