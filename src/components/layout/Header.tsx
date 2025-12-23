"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnector } from "@/components/wallet";
import NetworkSelect from "./NetworkSelect";
import NavMobile from "./NavMobile";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/transactions", label: "Transactions" },
  { href: "/analytics", label: "Analytics" },
  { href: "/validators", label: "Validators" },
  { href: "/blocks", label: "Blocks" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm transition-colors hover:text-foreground ${
        isActive ? "font-bold text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Explorer</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <div className="hidden md:block">
            <ThemeToggle />
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
      </div>
    </header>
  );
}
