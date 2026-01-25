"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X, Loader2, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Button as DesignButton } from "@movementlabsxyz/movement-design-system";
import { SearchBar } from "@/components/search/SearchBar";
import { useSearch, SearchResult } from "@/hooks/common/useSearch";
import { cn } from "@/lib/utils";

interface PageNavigationProps {
  className?: string;
  title?: string;
}

export default function PageNavigation({
  className,
  title,
}: PageNavigationProps) {
  const router = useRouter();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 100;

  // Mobile search state
  const [mobileSearchValue, setMobileSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { results, search, clearResults, isLoading } = useSearch();
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // Auto focus input when search expands
  useEffect(() => {
    if (isSearchExpanded && mobileInputRef.current) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [isSearchExpanded]);

  // Debounced search for mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mobileSearchValue.trim()) {
        search(mobileSearchValue);
        setShowResults(true);
      } else {
        clearResults();
        setShowResults(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [mobileSearchValue, search, clearResults]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > scrollThreshold) {
        if (currentScrollY > lastScrollY.current) {
          setIsHeaderHidden(true);
        } else if (currentScrollY < lastScrollY.current) {
          setIsHeaderHidden(false);
        }
      } else {
        setIsHeaderHidden(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMobileResultClick = (result: SearchResult) => {
    if (result.to) {
      router.push(result.to);
      setMobileSearchValue("");
      setShowResults(false);
      setIsSearchExpanded(false);
    }
  };

  const handleCloseSearch = () => {
    setIsSearchExpanded(false);
    setMobileSearchValue("");
    setShowResults(false);
    clearResults();
  };

  return (
    <nav
      className={cn(
        "sticky z-40 w-full transition-all duration-300",
        "bg-background/80",
        "backdrop-blur-xl",
        // Desktop: always top-16
        "md:top-16",
        // Mobile: top-0 when header hidden, top-16 when visible
        isHeaderHidden ? "top-0" : "top-16",
        className
      )}
    >
      <div className="container mx-auto flex h-14 md:h-16 items-center px-4">
        {/* ===== Mobile Layout ===== */}
        <div className="flex md:hidden items-center w-full gap-2" ref={mobileSearchContainerRef}>
          {/* Left: Back/Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => isSearchExpanded ? handleCloseSearch() : router.back()}
            className="shrink-0 text-muted-foreground hover:text-black transition-colors"
          >
            {isSearchExpanded ? (
              <X className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
          </Button>

          {/* Middle: Title (when collapsed) or Search Input (when expanded) */}
          <div className="flex-1 min-w-0 relative">
            {/* Title - visible when search is collapsed */}
            <div
              className={cn(
                "transition-all duration-300 ease-out",
                isSearchExpanded
                  ? "opacity-0 scale-95 pointer-events-none absolute inset-0"
                  : "opacity-100 scale-100"
              )}
            >
              {title && (
                <h1 className="text-xl font-semibold text-guild-green-400 shadow-[0_0_15px_rgba(88,197,137,0.2)] truncate">
                  {title}
                </h1>
              )}
            </div>

            {/* Search Input - visible when search is expanded */}
            <div
              className={cn(
                "transition-all duration-300 ease-out",
                isSearchExpanded
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none absolute inset-0"
              )}
            >
              <input
                ref={mobileInputRef}
                type="text"
                value={mobileSearchValue}
                onChange={(e) => setMobileSearchValue(e.target.value)}
                onFocus={() => mobileSearchValue.trim() && results.length > 0 && setShowResults(true)}
                placeholder="Search..."
                className={cn(
                  "w-full h-8 pl-3 pr-3 bg-background/60 border border-guild-green-500/40 rounded-lg",
                  "text-sm text-foreground placeholder:text-muted-foreground/60",
                  "outline-none transition-all duration-200",
                  "focus:border-guild-green-400 focus:bg-background/80"
                )}
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
              )}

              {/* Mobile search results dropdown */}
              {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-card/95 backdrop-blur-sm border border-guild-green-500/40 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {results.length === 1 && results[0].type === "none" ? (
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                      <p className="text-sm text-muted-foreground">No results found</p>
                    </div>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto divide-y divide-border/30">
                      {results.map((result, index) => (
                        <li
                          key={`${result.to}-${index}`}
                          onClick={() => handleMobileResultClick(result)}
                          className={cn(
                            "px-4 py-3 cursor-pointer transition-all duration-150",
                            "hover:bg-guild-green-500/10 text-foreground",
                            !result.to && "cursor-default text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {result.image ? (
                              <img src={result.image} alt="" className="w-5 h-5 rounded-full" />
                            ) : (
                              <CornerDownLeft size={12} className="text-guild-green-400/60" />
                            )}
                            <span className="text-sm font-medium truncate">{result.label}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Search button (always visible, unchanged) */}
          <DesignButton
            variant="glow"
            onClick={() => setIsSearchExpanded(true)}
            className="shrink-0 w-8! h-8! max-w-none! p-0! rounded-lg! shadow-[2px_2px_0_0_#0337FF]! hover:shadow-[-2px_-2px_0_0_#0337FF]! transition-all duration-200"
          >
            <Search className="h-4 w-4" />
          </DesignButton>
        </div>

        {/* ===== Desktop Layout ===== */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-black transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {title && (
            <h1 className="text-xl font-semibold text-guild-green-400 shadow-[0_0_15px_rgba(88,197,137,0.2)]">
              {title}
            </h1>
          )}
        </div>
        <div className="hidden md:block flex-1" />
        <div className="hidden md:block w-full max-w-xl">
          <SearchBar
            variant="navigation"
            placeholder="Search address, txn, block..."
          />
        </div>
      </div>
    </nav>
  );
}
