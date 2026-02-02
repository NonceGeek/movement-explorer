import { PackageMetadata } from "@/hooks/accounts/useGetAccountPackages";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styling";
import { Package } from "lucide-react";

interface PackagesSidebarProps {
  packages: PackageMetadata[];
  selectedPackageName: string;
  onSelectPackage: (name: string) => void;
}

export default function PackagesSidebar({
  packages,
  selectedPackageName,
  onSelectPackage,
}: PackagesSidebarProps) {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-sm">Packages</h3>
      </div>
      <div className="max-h-[600px] overflow-y-auto p-2 space-y-1">
        {packages.map((pkg) => (
          <Button
            key={pkg.name}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 h-auto py-3 px-3",
              selectedPackageName === pkg.name
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:bg-muted",
            )}
            onClick={() => onSelectPackage(pkg.name)}
          >
            <Package className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-mono">{pkg.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
