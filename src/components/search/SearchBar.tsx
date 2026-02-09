"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearch, SearchResult } from "@/hooks/common/useSearch";
import {
  Search,
  Loader2,
  ArrowRight,
  CornerDownLeft,
  SearchX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@movementlabsxyz/movement-design-system";

export interface SearchBarProps {
  variant?: "default" | "hero" | "hero-subtle" | "navigation";
  placeholder?: string;
}

export function SearchBar({
  variant = "default",
  placeholder = "Search by Account / Txn Hash / Block Height...",
}: SearchBarProps) {
  const router = useRouter();
  const { results, search, clearResults, isLoading } = useSearch();
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim()) {
        search(inputValue);
        setIsOpen(true);
      } else {
        clearResults();
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, search, clearResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + results.length) % results.length
        );
        break;
      case "Enter":
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected?.to) {
          router.push(selected.to);
          setInputValue("");
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.to) {
      router.push(result.to);
      setInputValue("");
      setIsOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();

    // If there are results, navigate to the first one
    if (results.length > 0 && results[0].to) {
      router.push(results[0].to);
      setInputValue("");
      setIsOpen(false);
    } else if (trimmed) {
      // If there's input but no results yet, trigger a search
      search(trimmed);
      setIsOpen(true);
    }
  };

  // Hero variant for homepage
  if (variant === "hero") {
    return (
      <div ref={containerRef} className="relative w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-card border-2 border-guild-green-300 rounded-xl overflow-hidden shadow-[0_0_0_0_#0337FF] transition-all duration-300 ease-out focus-within:-translate-y-1 focus-within:shadow-[5px_5px_0_0_#0337FF]"
        >
          <div className="pl-4 text-[#999]">
            <Search size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() =>
              inputValue.trim() && results.length > 0 && setIsOpen(true)
            }
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none px-4 py-4 text-base text-white placeholder:text-[#999] outline-none"
          />
          <Button
            type="submit"
            variant="glow"
            disabled={isLoading}
            className="m-1.5 sm:m-2 w-auto! max-w-none! p-2.5 sm:p-3! px-3 sm:px-6! text-sm sm:text-base! rounded-lg! shadow-[4px_4px_0_0_#0337FF]! hover:shadow-[-4px_-4px_0_0_#0337FF]!"
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin !w-6 !h-6" />
            ) : (
              <>
                <Search size={24} className="!w-6 !h-6" />
                {/* <span className="hidden sm:inline ml-1.5">Search</span> */}
              </>
            )}
          </Button>
        </form>

        {/* Results dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-100 w-full mt-3 bg-card/95 backdrop-blur-md border-2 border-guild-green-300 rounded-xl shadow-[4px_4px_0_0_#0337FF] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Check if only result is "No Results" */}
            {results.length === 1 && results[0].type === "none" ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="w-14 h-14 rounded-full bg-guild-green-300/10 flex items-center justify-center mb-4">
                  <SearchX size={28} className="text-guild-green-400/60" />
                </div>
                <p className="text-base font-medium text-foreground">
                  No results found
                </p>
                <p className="text-sm text-guild-green-400/60 mt-1.5">
                  Try searching for an address, transaction, or block
                </p>
              </div>
            ) : (
              <ul className="max-h-[22rem] overflow-y-auto divide-y divide-border/50">
                {results.map((result, index) => (
                  <li
                    key={`${result.to}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className={`px-4 py-4 cursor-pointer transition-all duration-200 ${
                      index === selectedIndex
                        ? "bg-guild-green-300/20 border-l-4 border-l-guild-green-300"
                        : "hover:bg-guild-green-300/10 border-l-4 border-l-transparent hover:border-l-guild-green-300/50"
                    } ${
                      !result.to
                        ? "cursor-default text-muted-foreground"
                        : "hover:pl-6"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {result.image ? (
                        <img
                          src={result.image}
                          alt=""
                          className="w-7 h-7 rounded-full ring-2 ring-guild-green-300/30"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-guild-green-300/20 flex items-center justify-center">
                          <CornerDownLeft
                            size={16}
                            className="text-guild-green-400"
                          />
                        </div>
                      )}
                      <span
                        className={`text-base font-medium ${
                          index === selectedIndex
                            ? "text-guild-green-300"
                            : "text-foreground"
                        }`}
                      >
                        {result.label}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  // Hero Subtle variant - 弱化版的首页搜索栏
  if (variant === "hero-subtle") {
    return (
      <div ref={containerRef} className="relative w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-background/60 backdrop-blur-sm border border-border/60 rounded-xl overflow-hidden transition-all duration-300 ease-out focus-within:border-guild-green-500 focus-within:bg-background/80"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() =>
              inputValue.trim() && results.length > 0 && setIsOpen(true)
            }
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none px-4 py-4 text-base text-white placeholder:text-[#999] outline-none"
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={isLoading}
            className="m-1.5 sm:m-2 w-auto! max-w-none! p-2.5 sm:p-3! px-3 sm:px-6! text-sm sm:text-base! rounded-lg! bg-guild-green-500! hover:bg-guild-green-600! text-white! border-0!"
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin !w-6 !h-6 text-black" />
            ) : (
              <Search size={24} className="!w-6 !h-6 text-black" />
            )}
          </Button>
        </form>

        {/* Results dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-100 w-full mt-3 bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Check if only result is "No Results" */}
            {results.length === 1 && results[0].type === "none" ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <SearchX size={28} className="text-muted-foreground/60" />
                </div>
                <p className="text-base font-medium text-foreground">
                  No results found
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Try searching for an address, transaction, or block
                </p>
              </div>
            ) : (
              <ul className="max-h-[22rem] overflow-y-auto divide-y divide-border/30">
                {results.map((result, index) => (
                  <li
                    key={`${result.to}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className={`px-4 py-4 cursor-pointer transition-all duration-200 ${
                      index === selectedIndex
                        ? "bg-guild-green-500/15 border-l-4 border-l-guild-green-500/70"
                        : "hover:bg-muted/50 border-l-4 border-l-transparent hover:border-l-guild-green-500/30"
                    } ${
                      !result.to
                        ? "cursor-default text-muted-foreground"
                        : "hover:pl-6"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {result.image ? (
                        <img
                          src={result.image}
                          alt=""
                          className="w-7 h-7 rounded-full ring-1 ring-border/50"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
                          <CornerDownLeft
                            size={16}
                            className="text-muted-foreground"
                          />
                        </div>
                      )}
                      <span
                        className={`text-base font-medium ${
                          index === selectedIndex
                            ? "text-guild-green-400"
                            : "text-foreground"
                        }`}
                      >
                        {result.label}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  // Navigation variant - Etherscan style for PageNavigation bar
  if (variant === "navigation") {
    // Helper to get type label for Etherscan-style display
    const getTypeLabel = (type: string) => {
      const labels: Record<string, string> = {
        account: "Address",
        transaction: "Txn",
        block: "Block",
        token: "Token",
        none: "",
      };
      return labels[type] || type;
    };

    return (
      <div ref={containerRef} className="relative w-full">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          {/* Search icon on left */}
          <Search
            size={16}
            className="absolute left-3 text-muted-foreground pointer-events-none"
          />

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() =>
              inputValue.trim() && results.length > 0 && setIsOpen(true)
            }
            placeholder={placeholder}
            className="w-full h-10 pl-9 pr-20 bg-muted/50 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors duration-200 focus:border-primary/50 focus:bg-muted/70"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-1 h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-md transition-colors duration-150 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Results dropdown - Etherscan style */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-100 w-full mt-1 bg-card border border-border/60 rounded-lg shadow-md overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {results.length === 1 && results[0].type === "none" ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <SearchX size={16} />
                <span>No results found</span>
              </div>
            ) : (
              <ul className="max-h-72 overflow-y-auto">
                {results.map((result, index) => (
                  <li
                    key={`${result.to}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className={`px-3 py-2.5 cursor-pointer transition-colors duration-100 border-b border-border/30 last:border-b-0 ${
                      index === selectedIndex
                        ? "bg-primary/10"
                        : "hover:bg-muted/50"
                    } ${!result.to ? "cursor-default opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt=""
                            className="w-5 h-5 rounded-full shrink-0"
                          />
                        ) : (
                          <ArrowRight
                            size={14}
                            className="text-muted-foreground shrink-0"
                          />
                        )}
                        <span className="text-sm truncate">{result.label}</span>
                      </div>
                      {result.type && result.type !== "none" && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                          {getTypeLabel(result.type)}
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
    );
  }

  // Default variant
  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() =>
            inputValue.trim() && results.length > 0 && setIsOpen(true)
          }
          placeholder={placeholder}
          className="w-full pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-100 w-full mt-2 bg-card/95 backdrop-blur-sm border-2 border-guild-green-300 rounded-xl shadow-[4px_4px_0_0_#0337FF] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Check if only result is "No Results" */}
          {results.length === 1 && results[0].type === "none" ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-guild-green-300/10 flex items-center justify-center mb-4">
                <SearchX size={28} className="text-guild-green-400/60" />
              </div>
              <p className="text-base font-medium text-foreground">
                No results found
              </p>
              <p className="text-sm text-guild-green-400/60 mt-1.5">
                Try searching for an address, transaction, or block
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border/50">
              {results.map((result, index) => (
                <li
                  key={`${result.to}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className={`px-4 py-3.5 cursor-pointer transition-all duration-200 ${
                    index === selectedIndex
                      ? "bg-guild-green-300/20 border-l-4 border-l-guild-green-300"
                      : "hover:bg-guild-green-300/10 border-l-4 border-l-transparent hover:border-l-guild-green-300/50"
                  } ${
                    !result.to
                      ? "cursor-default text-muted-foreground"
                      : "hover:pl-5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt=""
                        className="w-6 h-6 rounded-full ring-1 ring-guild-green-300/30"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-guild-green-300/20 flex items-center justify-center">
                        <CornerDownLeft
                          size={12}
                          className="text-guild-green-400"
                        />
                      </div>
                    )}
                    <span
                      className={`text-sm font-medium ${
                        index === selectedIndex
                          ? "text-guild-green-300"
                          : "text-foreground"
                      }`}
                    >
                      {result.label}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
