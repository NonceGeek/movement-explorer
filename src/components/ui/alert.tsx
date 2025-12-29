import * as React from "react";
import {
  Alert as DSAlert,
  AlertTitle as DSAlertTitle,
  AlertDescription as DSAlertDescription,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const Alert = React.forwardRef<
  React.ElementRef<typeof DSAlert>,
  React.ComponentPropsWithoutRef<typeof DSAlert>
>(({ className, ...props }, ref) => (
  <DSAlert ref={ref} className={cn(className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  React.ElementRef<typeof DSAlertTitle>,
  React.ComponentPropsWithoutRef<typeof DSAlertTitle>
>(({ className, ...props }, ref) => (
  <DSAlertTitle ref={ref} className={cn(className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  React.ElementRef<typeof DSAlertDescription>,
  React.ComponentPropsWithoutRef<typeof DSAlertDescription>
>(({ className, ...props }, ref) => (
  <DSAlertDescription ref={ref} className={cn(className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
