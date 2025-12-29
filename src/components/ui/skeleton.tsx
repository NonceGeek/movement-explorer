import * as React from "react";
import { Skeleton as DSSkeleton } from "@movementlabsxyz/movement-design-system";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return <DSSkeleton ref={ref} className={cn(className)} {...props} />;
});
Skeleton.displayName = "Skeleton";

export { Skeleton };
