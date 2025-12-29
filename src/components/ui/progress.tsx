"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Progress as DSProgress } from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <DSProgress ref={ref} value={value} className={cn(className)} {...props} />
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
