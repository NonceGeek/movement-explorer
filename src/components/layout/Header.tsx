"use client";

import { WalletConnector } from "@/components/wallet";
import { TooltipProvider } from "@/components/ui/tooltip";
import NetworkSelect from "./NetworkSelect";
import NavMobile from "./NavMobile";
import { Logo, NavigationLink, HeaderSearchBar } from "./header-parts";
import { NAV_LINKS } from "./types";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/80">
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
            {/* Search Bar (Desktop) - Only shows on sub-pages */}
            <div className="hidden md:block">
              <HeaderSearchBar />
            </div>

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
