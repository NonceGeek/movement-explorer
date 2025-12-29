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

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof DSTabsTrigger>,
  React.ComponentPropsWithoutRef<typeof DSTabsTrigger>
>(({ className, ...props }, ref) => (
  <DSTabsTrigger ref={ref} className={cn(className)} {...props} />
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
