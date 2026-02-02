"use client";

import * as React from "react";
import {
  Tabs as DSTabs,
  TabsList as DSTabsList,
  TabsTrigger as DSTabsTrigger,
  TabsContent as DSTabsContent,
} from "@movementlabsxyz/movement-design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/utils/styling";

const Tabs = DSTabs;

const TabsList = React.forwardRef<
  React.ElementRef<typeof DSTabsList>,
  React.ComponentPropsWithoutRef<typeof DSTabsList>
>(({ className, ...props }, ref) => (
  <DSTabsList ref={ref} className={cn(className)} {...props} />
));
TabsList.displayName = "TabsList";

export type TabsTriggerVariant = "default" | "interactive";

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<
  typeof DSTabsTrigger
> {
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
      className,
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

interface ResponsiveTabItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface ResponsiveTabsListProps {
  items: ResponsiveTabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

function ResponsiveTabsList({
  items,
  activeTab,
  onTabChange,
  className,
}: ResponsiveTabsListProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-2 -mx-4 px-4 md:mx-0 md:px-0",
        className,
      )}
    >
      {/* Mobile: Dropdown Select */}
      <div className="md:hidden">
        <Select value={activeTab} onValueChange={onTabChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                <div className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tab Pills */}
      <TabsList className="hidden md:inline-flex w-full justify-center">
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            variant="interactive"
          >
            {item.icon}
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, ResponsiveTabsList };
