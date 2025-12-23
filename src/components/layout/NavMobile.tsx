"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/transactions", label: "Transactions" },
  { href: "/analytics", label: "Analytics" },
  { href: "/validators", label: "Validators" },
  { href: "/blocks", label: "Blocks" },
];

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
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleLinkClick}
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
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
            <div className="px-4">
              <p className="text-sm text-muted-foreground mb-2">Theme</p>
              <ThemeToggle />
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

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
