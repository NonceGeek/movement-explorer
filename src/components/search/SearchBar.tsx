"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearch, SearchResult } from "@/hooks/common/useSearch";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface SearchBarProps {
  variant?: "default" | "hero";
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
    if (results.length > 0 && results[0].to) {
      router.push(results[0].to);
      setInputValue("");
      setIsOpen(false);
    }
  };

  // Hero variant for homepage
  if (variant === "hero") {
    return (
      <div ref={containerRef} className="relative w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 focus-within:border-moveus-marigold-500 focus-within:ring-2 focus-within:ring-moveus-marigold-500/20"
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
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3.5 m-2 bg-moveus-marigold-500 hover:bg-moveus-marigold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Search
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Results dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            <ul className="max-h-80 overflow-y-auto">
              {results.map((result, index) => (
                <li
                  key={`${result.to}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                  } ${
                    !result.to ? "cursor-default text-muted-foreground" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.image && (
                      <img
                        src={result.image}
                        alt=""
                        className="w-5 h-5 rounded"
                      />
                    )}
                    <span className="text-sm">{result.label}</span>
                  </div>
                </li>
              ))}
            </ul>
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
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <ul className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <li
                key={`${result.to}-${index}`}
                onClick={() => handleResultClick(result)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  index === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                } ${!result.to ? "cursor-default text-muted-foreground" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {result.image && (
                    <img
                      src={result.image}
                      alt=""
                      className="w-5 h-5 rounded"
                    />
                  )}
                  <span className="text-sm">{result.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
