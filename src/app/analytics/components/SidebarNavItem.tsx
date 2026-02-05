"use client";

import { cn } from "@/utils/styling";

interface SidebarNavItemProps {
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
}

/**
 * SidebarNavItem - Individual navigation item for the analytics sidebar
 * Features:
 * - Active state with primary color highlight
 * - Hover state with muted background
 * - Optional icon support
 * - Border highlight on active state
 */
export default function SidebarNavItem({
  label,
  icon,
  isActive = false,
  onClick,
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
        "hover:bg-muted/50 cursor-pointer",
        isActive
          ? "bg-primary/10 text-primary border-none border-primary"
          : "text-muted-foreground border-none border-transparent"
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="text-left">{label}</span>
    </button>
  );
}
