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
  variant?: "default" | "hero" | "navigation";
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
          <div className="pl-4 text-muted-foreground">
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
            className="flex-1 bg-transparent border-none px-4 py-4 text-base text-foreground placeholder:text-muted-foreground outline-none"
          />
          <Button
            type="submit"
            variant="glow"
            disabled={isLoading}
            className="m-1.5 sm:m-2 w-auto! max-w-none! p-2.5 sm:p-3! px-3 sm:px-6! text-sm sm:text-base! rounded-lg! shadow-[4px_4px_0_0_#0337FF]! hover:shadow-[-4px_-4px_0_0_#0337FF]!"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Search</span>
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>

        {/* Results dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-100 w-full mt-3 bg-card/95 backdrop-blur-sm border-2 border-guild-green-300 rounded-xl shadow-[4px_4px_0_0_#0337FF] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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

  // Navigation variant - for PageNavigation bar
  if (variant === "navigation") {
    return (
      <div ref={containerRef} className="relative w-full">
        <form
          onSubmit={handleSubmit}
          className="relative group flex items-center"
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
            className="w-full h-12 pl-5 pr-14 bg-background/40 backdrop-blur-sm border border-guild-green-500/40 rounded-xl text-base text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-300 ease-out focus:border-guild-green-400 focus:bg-background/60 shadow-[0_0_0_0_rgba(88,197,137,0.4)] focus:shadow-[4px_4px_0_0_rgba(88,197,137,0.4)] focus:-translate-y-0.5"
          />

          <Button
            type="submit"
            variant="glow"
            disabled={isLoading}
            className="absolute right-1.5 w-9 h-9 p-0 rounded-lg! shadow-[2px_2px_0_0_#0337FF]! hover:shadow-[-2px_-2px_0_0_#0337FF]! transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </Button>
        </form>

        {/* Results dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-100 w-full mt-2 bg-card/95 backdrop-blur-sm border border-guild-green-500/40 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {results.length === 1 && results[0].type === "none" ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <SearchX size={24} className="text-guild-green-400/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No results found
                </p>
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto divide-y divide-border/30">
                {results.map((result, index) => (
                  <li
                    key={`${result.to}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className={`px-4 py-3 cursor-pointer transition-all duration-150 ${
                      index === selectedIndex
                        ? "bg-guild-green-500/15 text-guild-green-300"
                        : "hover:bg-guild-green-500/10 text-foreground"
                    } ${
                      !result.to ? "cursor-default text-muted-foreground" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.image ? (
                        <img
                          src={result.image}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <CornerDownLeft
                          size={12}
                          className="text-guild-green-400/60"
                        />
                      )}
                      <span className="text-sm font-medium truncate">
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
