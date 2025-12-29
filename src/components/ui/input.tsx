import * as React from "react";
import { Input as DSInput } from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  React.ElementRef<typeof DSInput>,
  React.ComponentPropsWithoutRef<typeof DSInput>
>(({ className, type, ...props }, ref) => {
  return <DSInput ref={ref} type={type} className={cn(className)} {...props} />;
});
Input.displayName = "Input";

export { Input };
