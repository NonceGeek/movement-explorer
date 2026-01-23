"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300",
        isScrolled
          ? "border-border/50 bg-background/80"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
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
