"use client";

import { cn } from "@/utils/styling";
import {
  BookOpen,
  Code,
  Key,
  Bot,
  FileText,
  X,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export type DevelopersSectionId =
  | "overview"
  | "api-docs"
  | "guides"
  | "api-keys"
  | "ai-assistant";

interface SidebarItem {
  id: DevelopersSectionId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
    href: "/developers",
  },
  {
    id: "api-docs",
    title: "API Docs",
    icon: Code,
    href: "/developers/api",
  },
  {
    id: "guides",
    title: "Guides",
    icon: FileText,
    href: "/developers/guides",
  },
  {
    id: "api-keys",
    title: "API Keys",
    icon: Key,
    href: "/developers/api-keys",
    badge: "Soon",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    icon: Bot,
    href: "/developers/ai",
    badge: "Soon",
  },
];

interface DevelopersSidebarProps {
  activeSection: DevelopersSectionId;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

function SidebarNav({
  activeSection,
  onItemClick,
}: {
  activeSection: DevelopersSectionId;
  onItemClick?: (item: SidebarItem) => void;
}) {
  return (
    <div className="p-4 space-y-1">
      {SIDEBAR_ITEMS.map((item) => (
        <a
          key={item.id}
          href={item.badge ? undefined : item.href}
          onClick={(e) => {
            if (item.badge) {
              e.preventDefault();
              return;
            }
            onItemClick?.(item);
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeSection === item.id
              ? "bg-guild-green/10 text-guild-green"
              : item.badge
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {item.badge}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

export default function DevelopersSidebar({
  activeSection,
  isMobileOpen,
  onMobileToggle,
}: DevelopersSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block w-[250px] flex-shrink-0 self-start sticky top-32 z-10",
          "bg-card/80 backdrop-blur-sm border border-border/30 rounded-lg",
          "max-h-[calc(100vh-6rem)] overflow-hidden"
        )}
      >
        <SidebarNav activeSection={activeSection} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileToggle}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold">Developers</span>
            <button onClick={onMobileToggle}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarNav
            activeSection={activeSection}
            onItemClick={() => onMobileToggle()}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
