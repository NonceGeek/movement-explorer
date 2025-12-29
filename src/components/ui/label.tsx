"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Label as DSLabel } from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <DSLabel ref={ref} className={cn(className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
