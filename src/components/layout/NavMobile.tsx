"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WalletConnector } from "@/components/wallet";
import NetworkSelect from "./NetworkSelect";
import ThemeToggle from "./ThemeToggle";
import { NAV_ITEMS, isNavDropdown } from "./types";

const homeLink = { href: "/", label: "Home" };

export default function NavMobile() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="h-10 w-10">
            <Menu size={36} className="!w-9 !h-9" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[85vw] sm:w-[400px] border-l-0 p-0">
          <SheetHeader className="px-6 pt-8 pb-4">
            <SheetTitle className="text-left text-3xl font-bold tracking-tight">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 mt-2 h-full overflow-y-auto pb-10">
            {/* Navigation Links */}
            <nav className="flex flex-col px-4">
              {/* Home link */}
              <Link
                href={homeLink.href}
                onClick={handleLinkClick}
                className={`px-4 py-4 rounded-xl text-xl transition-colors ${
                  pathname === homeLink.href
                    ? "bg-primary/5 text-primary font-semibold"
                    : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {homeLink.label}
              </Link>

              {/* Dynamic nav items */}
              {NAV_ITEMS.map((item) => {
                if (isNavDropdown(item)) {
                  const isGroupActive = item.items.some(
                    (subItem) =>
                      pathname === subItem.href ||
                      pathname.startsWith(`${subItem.href}/`)
                  );
                  return (
                    <div key={item.label} className="flex flex-col mt-2">
                      <div
                        className={`px-4 py-3 text-base font-semibold uppercase tracking-wider text-muted-foreground/70`}
                      >
                        {item.label}
                      </div>
                      <div className="flex flex-col gap-1">
                        {item.items.map((subItem) => {
                          const isMatch =
                            pathname === subItem.href ||
                            pathname.startsWith(`${subItem.href}/`);
                          // Only highlight if no sibling has a more specific (longer) match
                          const hasMoreSpecific = isMatch && item.items.some(
                            (other) =>
                              other.href !== subItem.href &&
                              other.href.length > subItem.href.length &&
                              (pathname === other.href || pathname.startsWith(`${other.href}/`)),
                          );
                          const isActive = isMatch && !hasMoreSpecific;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={handleLinkClick}
                              className={`px-4 py-4 pl-8 rounded-xl text-lg transition-colors ${
                                isActive
                                  ? "bg-primary/5 text-primary font-semibold"
                                  : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`px-4 py-4 rounded-xl text-xl transition-colors ${
                      isActive
                        ? "bg-primary/5 text-primary font-semibold"
                        : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pb-8">
              {/* Divider */}
              <div className="h-px bg-border/40 my-6 mx-6" />

              {/* Network Select */}
              <div className="px-6">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground/70 mb-4 px-2">Network</p>
                <NetworkSelect />
              </div>

              {/* Divider */}
              <div className="h-px bg-border/40 my-6 mx-6" />

              {/* Theme */}
              <div className="px-6">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground/70 mb-4 px-2">Theme</p>
                <ThemeToggle />
              </div>

              {/* Divider */}
              <div className="h-px bg-border/40 my-6 mx-6" />

              {/* Wallet Connector */}
              <div className="px-6">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground/70 mb-4 px-2">Wallet</p>
                <WalletConnector />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
