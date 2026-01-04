"use client";

import { useState, useEffect } from "react";
import { WalletConnector } from "@/components/wallet";
import { TooltipProvider } from "@/components/ui/tooltip";
import NetworkSelect from "./NetworkSelect";
import NavMobile from "./NavMobile";
import { Logo, NavigationLink } from "./header-parts";
import { NAV_LINKS } from "./types";
import { cn } from "@/lib/utils";

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
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavigationLink
              key={link.href}
              href={link.href}
              label={link.label}
            />
          ))}
        </nav>

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
