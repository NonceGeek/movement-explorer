"use client";

import * as React from "react";
import {
  Tabs as DSTabs,
  TabsList as DSTabsList,
  TabsTrigger as DSTabsTrigger,
  TabsContent as DSTabsContent,
} from "@movementlabsxyz/movement-design-system";

import { cn } from "@/lib/utils";

const Tabs = DSTabs;

const TabsList = React.forwardRef<
  React.ElementRef<typeof DSTabsList>,
  React.ComponentPropsWithoutRef<typeof DSTabsList>
>(({ className, ...props }, ref) => (
  <DSTabsList ref={ref} className={cn(className)} {...props} />
));
TabsList.displayName = "TabsList";

export type TabsTriggerVariant = "default" | "interactive";

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof DSTabsTrigger> {
  variant?: TabsTriggerVariant;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof DSTabsTrigger>,
  TabsTriggerProps
>(({ className, variant = "default", ...props }, ref) => (
  <DSTabsTrigger
    ref={ref}
    className={cn(
      variant === "interactive" &&
        "cursor-pointer hover:bg-muted/50 data-[state=active]:hover:bg-background transition-[color,box-shadow,background-color]",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  React.ElementRef<typeof DSTabsContent>,
  React.ComponentPropsWithoutRef<typeof DSTabsContent>
>(({ className, ...props }, ref) => (
  <DSTabsContent ref={ref} className={cn(className)} {...props} />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
