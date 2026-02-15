"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { useSearch, SearchResult } from "@/hooks/common/useSearch";
import { cn } from "@/utils/styling";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import dynamic from "next/dynamic";

const NetworkBadge = dynamic(() => import("./NetworkBadge"), { ssr: false });
const GasPriceIndicator = dynamic(() => import("./GasPriceIndicator"), {
  ssr: false,
});

interface PageNavigationProps {
  className?: string;
  /** 是否在桌面端隐藏，默认 false */
  hideOnDesktop?: boolean;
  /** 左侧装饰内容 */
  headerEndDecorator?: React.ReactNode;
}

export default function PageNavigation({
  className,
  hideOnDesktop = false,
  headerEndDecorator,
}: PageNavigationProps) {
  const router = useRouter();
  const { scrollY } = useScrollDirection();

  // Show network badge after header (h-16 = 64px) has scrolled out of view
  const showNetworkBadge = scrollY > 64;

  // Mobile search state
  const [mobileSearchValue, setMobileSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { results, search, clearResults, isLoading } = useSearch();
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

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

  const handleMobileResultClick = (result: SearchResult) => {
    if (result.to) {
      router.push(result.to);
      setMobileSearchValue("");
      setShowResults(false);
    }
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        "bg-transparent backdrop-blur-xl",
        hideOnDesktop && "md:hidden",
        className,
      )}
    >
      <div className="container max-w-[1440px] mx-auto flex h-14 md:h-16 items-center px-4 sm:px-6 lg:px-12">
        {/* ===== Mobile Layout ===== */}
        <div
          className="flex md:hidden items-center w-full gap-2"
          ref={mobileSearchContainerRef}
        >
          <GasPriceIndicator />

          {/* Search Input - always visible */}
          <div className="flex-1 min-w-0 relative">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={mobileSearchValue}
                onChange={(e) => setMobileSearchValue(e.target.value)}
                onFocus={() =>
                  mobileSearchValue.trim() &&
                  results.length > 0 &&
                  setShowResults(true)
                }
                placeholder="Search..."
                className="w-full h-8 pl-8 pr-8 bg-muted/50 border border-border/60 rounded-md text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors duration-200 focus:border-primary/50 focus:bg-muted/70"
              />
              {isLoading && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
              )}

              {/* Mobile search results dropdown */}
              {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border/60 rounded-md shadow-md overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {results.length === 1 && results[0].type === "none" ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                      <Search size={14} />
                      <span>No results found</span>
                    </div>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto">
                      {results.map((result, index) => (
                        <li
                          key={`${result.to}-${index}`}
                          onClick={() => handleMobileResultClick(result)}
                          className={cn(
                            "px-3 py-2.5 cursor-pointer transition-colors duration-100 border-b border-border/30 last:border-b-0",
                            "hover:bg-muted/50",
                            !result.to && "cursor-default opacity-60",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {result.image ? (
                                <img
                                  src={result.image}
                                  alt=""
                                  className="w-4 h-4 rounded-full shrink-0"
                                />
                              ) : (
                                <ArrowRight
                                  size={12}
                                  className="text-muted-foreground shrink-0"
                                />
                              )}
                              <span className="text-sm truncate">
                                {result.label}
                              </span>
                            </div>
                            {result.type && result.type !== "none" && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                {result.type === "account"
                                  ? "Address"
                                  : result.type === "transaction"
                                    ? "Txn"
                                    : result.type === "block"
                                      ? "Block"
                                      : result.type}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {headerEndDecorator}
        </div>

        {/* ===== Desktop Layout ===== */}
        {!hideOnDesktop && (
          <>
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <GasPriceIndicator />
              {/* Network Badge - fade in after header scrolls away */}
              <div
                className={cn(
                  "transition-all duration-300 ease-out",
                  showNetworkBadge
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2 pointer-events-none",
                )}
              >
                <NetworkBadge />
              </div>
              {headerEndDecorator}
            </div>
            <div className="hidden md:block flex-1" />
            <div className="hidden md:block w-full max-w-xl">
              <SearchBar
                variant="navigation"
                placeholder="Search address, txn, block..."
              />
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
