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
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 mt-6">
            {/* Navigation Links */}
            <nav className="flex flex-col gap-2">
              {/* Home link */}
              <Link
                href={homeLink.href}
                onClick={handleLinkClick}
                className={`px-4 py-3 rounded-lg transition-colors ${
                  pathname === homeLink.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                    <div key={item.label} className="flex flex-col">
                      <div
                        className={`px-4 py-2 text-sm font-medium ${
                          isGroupActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </div>
                      {item.items.map((subItem) => {
                        const isActive =
                          pathname === subItem.href ||
                          pathname.startsWith(`${subItem.href}/`);
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={handleLinkClick}
                            className={`px-4 py-3 pl-8 rounded-lg transition-colors ${
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
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
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Network Select */}
            <div className="px-4">
              <p className="text-sm text-muted-foreground mb-2">Network</p>
              <NetworkSelect />
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Theme */}
            {/* <div className="px-4">
              <p className="text-sm text-muted-foreground mb-2">Theme</p>
              <ThemeToggle />
            </div> */}

            {/* Divider */}
            {/* <div className="h-px bg-border" /> */}

            {/* Wallet Connector */}
            <div className="px-4">
              <p className="text-sm text-muted-foreground mb-2">Wallet</p>
              <WalletConnector />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
