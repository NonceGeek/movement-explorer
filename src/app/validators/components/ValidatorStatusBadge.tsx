import { Badge } from "@/components/ui/badge";
import type { ValidatorStatus } from "@/utils/validators";

const STATUS_CONFIG: Record<
  string,
  { variant: "success" | "warning" | "error" | "default"; label: string }
> = {
  Active: { variant: "success", label: "Active" },
  "Pending Active": { variant: "warning", label: "Pending Active" },
  "Pending Inactive": { variant: "warning", label: "Pending Inactive" },
  Inactive: { variant: "error", label: "Inactive" },
};

export function ValidatorStatusBadge({
  status,
}: {
  status: ValidatorStatus | undefined;
}) {
  if (!status) {
    return <Badge variant="default">Unknown</Badge>;
  }
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
