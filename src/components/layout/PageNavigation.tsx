"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import { cn } from "@/lib/utils";

interface PageNavigationProps {
  className?: string;
}

export default function PageNavigation({ className }: PageNavigationProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <nav
      className={cn(
        "sticky top-16 z-40 w-full",
        "border-b border-border/30",
        "bg-background/60 backdrop-blur-xl",
        "supports-backdrop-filter:bg-background/60",
        className
      )}
    >
      <div className="container mx-auto flex h-14 items-center justify-between gap-6 px-4">
        {/* Back Button with label */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search Bar - constrained width */}
        <div className="w-full max-w-sm">
          <SearchBar placeholder="Search address, txn, block..." />
        </div>
      </div>
    </nav>
  );
}
