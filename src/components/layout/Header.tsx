"use client";

import { useState, useEffect, useRef } from "react";
import { WalletConnector } from "@/components/wallet";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavMobile from "./NavMobile";
import { Logo, NavigationLink, NavigationDropdown } from "./header-parts";
import { NAV_ITEMS, isNavDropdown } from "./types";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamic import to avoid useSearchParams SSR issues
const NetworkSelect = dynamic(() => import("./NetworkSelect"), { ssr: false });

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 100; // Start hiding after scrolling 100px

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 10);
      
      // Only apply hide/show logic on mobile (handled by CSS, but we track state)
      if (currentScrollY > scrollThreshold) {
        // Scrolling down - hide header
        if (currentScrollY > lastScrollY.current) {
          setIsHidden(true);
        } 
        // Scrolling up - show header
        else if (currentScrollY < lastScrollY.current) {
          setIsHidden(false);
        }
      } else {
        // Near top - always show
        setIsHidden(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      data-header-hidden={isHidden}
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300",
        "gradient-glass-overlay",
        isScrolled ? "border-border/50" : "border-transparent",
        // Mobile: hide header when scrolling down
        isHidden && "md:translate-y-0 -translate-y-full"
      )}
    >
      <div className="mx-auto flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-2">
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
            )
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
    </header>
  );
}
