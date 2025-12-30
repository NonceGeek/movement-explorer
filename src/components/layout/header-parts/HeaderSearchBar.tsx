"use client";

import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search";

/**
 * Header Search Bar Component
 * Displays a search input directly in the header (not a modal)
 * Only shows on sub-pages (not on the home page)
 */
export function HeaderSearchBar() {
  const pathname = usePathname();

  // Only show on sub-pages, not on home page
  const isHomePage = pathname === "/" || pathname === "";

  if (isHomePage) {
    return null;
  }

  return (
    <div className="w-64 lg:w-80">
      <SearchBar variant="default" placeholder="Search..." />
    </div>
  );
}
