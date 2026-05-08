"use client";

import { cn } from "@/utils/styling";
import {
  LayoutDashboard,
  Activity,
  Users,
  Code,
  Fuel,
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export type AnalyticsSectionId =
  | "overview"
  | "network-activity"
  | "user-metrics"
  | "developer-activity"
  | "gas-fees";

interface AnalyticsSidebarProps {
  activeSection?: AnalyticsSectionId;
  onSectionChange?: (section: AnalyticsSectionId) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const SIDEBAR_SECTIONS = [
  {
    id: "overview" as const,
    title: "Overview Stats",
    icon: LayoutDashboard,
  },
  {
    id: "network-activity" as const,
    title: "Network Activity",
    icon: Activity,
  },
  {
    id: "user-metrics" as const,
    title: "User Metrics",
    icon: Users,
  },
  {
    id: "developer-activity" as const,
    title: "Developer Activity",
    icon: Code,
  },
  {
    id: "gas-fees" as const,
    title: "Gas & Fees",
    icon: Fuel,
  },
];

/**
 * AnalyticsSidebar - Main sidebar navigation for analytics page
 * Features:
 * - Fixed sidebar on desktop (250px width, sticky)
 * - Drawer overlay on mobile using Sheet component
 * - Collapsible sections with icons
 * - Active state highlighting
 * - Smooth scroll to sections
 */
export default function AnalyticsSidebar({
  activeSection = "overview",
  onSectionChange,
  isMobileOpen,
  onMobileToggle,
}: AnalyticsSidebarProps) {
  const handleSectionClick = (sectionId: AnalyticsSectionId) => {
    // Let parent handle the section change and scrolling
    onSectionChange?.(sectionId);

    // Close mobile sidebar after selection
    if (isMobileOpen) {
      onMobileToggle();
    }
  };

  return (
    <>
      {/* Desktop Sidebar - Sticky, always stays at top */}
      <aside
        className={cn(
          "hidden lg:block w-[250px] shrink-0 self-start sticky top-32 z-10",
          "bg-card backdrop-blur-sm border border-border/30 rounded-lg",
          "max-h-[calc(100vh-6rem)] overflow-hidden"
        )}
      >
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)] p-4 space-y-1">
          {SIDEBAR_SECTIONS.map((section) => (
            <SidebarNavItem
              key={section.id}
              label={section.title}
              icon={<section.icon className="h-4 w-4" />}
              isActive={activeSection === section.id}
              onClick={() => handleSectionClick(section.id)}
            />
          ))}
        </div>
      </aside>

      {/* Mobile sheet */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileToggle}>
        <SheetContent side="left" className="w-[260px] p-0">
          <div className="pt-12 overflow-y-auto max-h-screen p-4 space-y-1">
            {SIDEBAR_SECTIONS.map((section) => (
              <SidebarNavItem
                key={section.id}
                label={section.title}
                icon={<section.icon className="h-4 w-4" />}
                isActive={activeSection === section.id}
                onClick={() => handleSectionClick(section.id)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
