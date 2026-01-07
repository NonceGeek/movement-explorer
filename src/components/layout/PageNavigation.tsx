"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { cn } from "@/lib/utils";

interface PageNavigationProps {
  className?: string;
  title?: string;
}

export default function PageNavigation({
  className,
  title,
}: PageNavigationProps) {
  return (
    <nav
      className={cn(
        "sticky top-16 z-40 w-full",
        "gradient-glass-overlay",
        "backdrop-blur-xl",
        className
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            className="text-lg font-medium text-muted-foreground hover:text-guild-green-400 transition-colors"
          >
            Home
          </Link>

          {title && (
            <>
              <ChevronRight size={18} className="text-guild-green-500/50" />
              <span className="text-lg font-semibold text-guild-green-400 shadow-[0_0_15px_rgba(88,197,137,0.2)]">
                {title}
              </span>
            </>
          )}
        </div>

        {/* Right: Search Bar - narrower as requested */}
        <div className="w-full max-w-xl">
          <SearchBar
            variant="navigation"
            placeholder="Search address, txn, block..."
          />
        </div>
      </div>
    </nav>
  );
}
