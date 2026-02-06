"use client";

import * as React from "react";
import { motion, LayoutGroup } from "framer-motion";
import {
  Tabs as DSTabs,
  TabsList as DSTabsList,
  TabsTrigger as DSTabsTrigger,
  TabsContent as DSTabsContent,
} from "@movementlabsxyz/movement-design-system";
import { cn } from "@/utils/styling";

const Tabs = DSTabs;

const LineTabsContext = React.createContext<string | null>(null);

export type TabsListVariant = "default" | "line" | "primary-line" | "pill";

interface TabsListProps extends React.ComponentPropsWithoutRef<
  typeof DSTabsList
> {
  variant?: TabsListVariant;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof DSTabsList>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => {
  const layoutId = React.useId();

  const list = (
    <DSTabsList
      ref={ref}
      className={cn(
        variant === "line" &&
          "bg-muted/30 p-1.5 px-2 gap-4 border-b border-border/50 w-full justify-start rounded-lg rounded-b-none h-auto",
        variant === "primary-line" &&
          "bg-transparent gap-1 border-b border-border/30 w-full justify-start rounded-none h-12 p-0",
        variant === "pill" &&
          "bg-transparent gap-2 border-b border-border/50 w-full justify-start rounded-none h-auto p-0 pb-4 flex-wrap",
        className,
      )}
      {...props}
    />
  );

  if (variant === "line" || variant === "primary-line") {
    return (
      <LineTabsContext.Provider value={layoutId}>
        <LayoutGroup>{list}</LayoutGroup>
      </LineTabsContext.Provider>
    );
  }

  return list;
});
TabsList.displayName = "TabsList";

export type TabsTriggerVariant = "default" | "interactive" | "line" | "primary-line" | "pill";

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<
  typeof DSTabsTrigger
> {
  variant?: TabsTriggerVariant;
}

function useDataStateActive(enabled: boolean) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    setIsActive(el.getAttribute("data-state") === "active");

    const observer = new MutationObserver(() => {
      setIsActive(el.getAttribute("data-state") === "active");
    });
    observer.observe(el, { attributes: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  }, [enabled]);

  return { ref, isActive };
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof DSTabsTrigger>,
  TabsTriggerProps
>(({ className, variant = "default", children, ...props }, forwardedRef) => {
  const lineLayoutId = React.useContext(LineTabsContext);
  const isLine = variant === "line";
  const isPrimaryLine = variant === "primary-line";
  const hasIndicator = isLine || isPrimaryLine;
  const { ref: activeRef, isActive } = useDataStateActive(hasIndicator);

  return (
    <DSTabsTrigger
      ref={(node) => {
        activeRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef)
          (forwardedRef as React.MutableRefObject<typeof node>).current = node;
      }}
      className={cn(
        variant === "interactive" &&
          "cursor-pointer hover:bg-muted/50 data-[state=active]:hover:bg-background transition-[color,box-shadow,background-color]",
        isLine &&
          "relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 shadow-none data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary hover:text-foreground transition-colors",
        isPrimaryLine &&
          "relative rounded-none border-b-3 border-transparent bg-transparent px-4 py-3 shadow-none data-[state=active]:border-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/80 transition-colors cursor-pointer",
        variant === "pill" &&
          "rounded-full px-4 py-2 text-sm font-medium border border-border bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:hover:bg-primary/90 transition-all cursor-pointer shadow-none",
        className,
      )}
      {...props}
    >
      {children}
      {hasIndicator && isActive && lineLayoutId && (
        <motion.div
          layoutId={`line-tab-indicator-${lineLayoutId}`}
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-primary",
            isPrimaryLine ? "h-0.75 rounded-t-full" : "h-0.5",
          )}
          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
        />
      )}
    </DSTabsTrigger>
  );
});
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
  badge?: number | string;
}

interface ResponsiveTabsListProps {
  items: ResponsiveTabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

function ResponsiveTabsList({
  items,
  className,
}: ResponsiveTabsListProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
        className,
      )}
    >
      <TabsList
        variant="primary-line"
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            variant="primary-line"
            className="shrink-0"
          >
            <span className="flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-md font-medium">
                  {typeof item.badge === "number" ? item.badge.toLocaleString() : item.badge}
                </span>
              )}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}

/**
 * Horizontal pill-style tabs
 * Features: rounded pill buttons, active state with primary background
 */
function PillTabsList({
  items,
  className,
}: ResponsiveTabsListProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-2",
        className,
      )}
    >
      <TabsList
        variant="pill"
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            variant="pill"
            className="shrink-0"
          >
            <span className="flex items-center gap-1.5">
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="text-xs bg-background/20 px-1.5 py-0.5 rounded font-medium">
                  {typeof item.badge === "number" ? item.badge.toLocaleString() : item.badge}
                </span>
              )}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}

/**
 * Compact left-aligned tabs (content-based width)
 * Industry standard for detail pages
 */
function CompactTabsList({
  items,
  className,
}: ResponsiveTabsListProps) {
  return (
    <div className={cn("flex justify-start border-b border-border/30", className)}>
      <TabsList
        variant="primary-line"
        className="!w-auto !inline-flex gap-0 h-auto p-0 bg-transparent border-b-0 rounded-none"
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            variant="primary-line"
            className="px-5 py-2.5 text-sm"
          >
            <span className="flex items-center gap-1.5">
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded font-medium">
                  {typeof item.badge === "number" ? item.badge.toLocaleString() : item.badge}
                </span>
              )}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, ResponsiveTabsList, PillTabsList, CompactTabsList };
