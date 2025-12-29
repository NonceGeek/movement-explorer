import * as React from "react";
import {
  Card as DSCard,
  CardHeader as DSCardHeader,
  CardFooter as DSCardFooter,
  CardTitle as DSCardTitle,
  CardDescription as DSCardDescription,
  CardContent as DSCardContent,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  React.ElementRef<typeof DSCard>,
  React.ComponentPropsWithoutRef<typeof DSCard>
>(({ className, ...props }, ref) => (
  <DSCard ref={ref} className={cn(className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  React.ElementRef<typeof DSCardHeader>,
  React.ComponentPropsWithoutRef<typeof DSCardHeader>
>(({ className, ...props }, ref) => (
  <DSCardHeader ref={ref} className={cn(className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardFooter = React.forwardRef<
  React.ElementRef<typeof DSCardFooter>,
  React.ComponentPropsWithoutRef<typeof DSCardFooter>
>(({ className, ...props }, ref) => (
  <DSCardFooter ref={ref} className={cn(className)} {...props} />
));
CardFooter.displayName = "CardFooter";

const CardTitle = React.forwardRef<
  React.ElementRef<typeof DSCardTitle>,
  React.ComponentPropsWithoutRef<typeof DSCardTitle>
>(({ className, ...props }, ref) => (
  <DSCardTitle ref={ref} className={cn(className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  React.ElementRef<typeof DSCardDescription>,
  React.ComponentPropsWithoutRef<typeof DSCardDescription>
>(({ className, ...props }, ref) => (
  <DSCardDescription ref={ref} className={cn(className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  React.ElementRef<typeof DSCardContent>,
  React.ComponentPropsWithoutRef<typeof DSCardContent>
>(({ className, ...props }, ref) => (
  <DSCardContent ref={ref} className={cn(className)} {...props} />
));
CardContent.displayName = "CardContent";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
