"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { WalletConnector } from "@/components/wallet";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavMobile from "./NavMobile";
import { Logo, NavigationLink, NavigationDropdown } from "./header-parts";
import { NAV_ITEMS, isNavDropdown } from "./types";
import { cn } from "@/utils/styling";
import dynamic from "next/dynamic";
import { SearchBar } from "@/components/search";
import { Search } from "lucide-react";

// Dynamic import to avoid useSearchParams SSR issues
const NetworkSelect = dynamic(() => import("./NetworkSelect"), { ssr: false });

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearchHeader, setShowSearchHeader] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const scrollThreshold = 180; // Approximate height of hero section

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 10);

      if (isHomePage) {
        setShowSearchHeader(currentScrollY > scrollThreshold);
      } else {
        setShowSearchHeader(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  return (
    <header
      className={cn(
        "z-50 w-full border-b backdrop-blur-xl transition-all duration-300",
        "bg-card/50",
        "border-border/40",
        // Only sticky on homepage; on sub-pages it scrolls away naturally
        isHomePage ? "sticky top-0" : "relative",
      )}
    >
      <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Mobile Search Header State */}
        <div
          className={cn(
            "md:hidden flex items-center w-full gap-3 transition-all duration-300 ease-in-out absolute inset-0 px-4",
            showSearchHeader
              ? "opacity-100 translate-y-0 z-10"
              : "opacity-0 translate-y-full pointer-events-none -z-10",
          )}
        >
          <div className="flex-1">
            <SearchBar variant="navigation" placeholder="Search..." />
          </div>
          <NavMobile />
        </div>

        {/* Standard Header Content */}
        <div
          className={cn(
            "flex items-center justify-between w-full transition-opacity duration-300",
            showSearchHeader && "md:opacity-100 opacity-0",
          )}
        >
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item, index) =>
                isNavDropdown(item) ? (
                  <NavigationDropdown
                    key={item.label}
                    label={item.label}
                    items={item.items}
                  />
                ) : (
                  <NavigationLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                  />
                ),
              )}
            </nav>
          </div>
          {/* Right Section */}
          <TooltipProvider>
            <div className="flex items-center gap-3">
              {/* Network Selector (Desktop) */}
              <div className="hidden md:block">
                <NetworkSelect />
              </div>

              {/* Wallet Connector (Desktop) */}
              <div className="hidden md:block">
                <WalletConnector />
              </div>

              {/* Mobile Menu */}
              <NavMobile />
            </div>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
