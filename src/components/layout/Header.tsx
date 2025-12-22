"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnector } from "@/components/wallet";

const navLinks = [
  { href: "/transactions", label: "Transactions" },
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Movement Explorer</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Network Badge */}
          <div className="hidden md:block">
            <div className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
              Mainnet
            </div>
          </div>

          {/* Wallet Connector */}
          <div className="hidden md:block">
            <WalletConnector />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-lg"
            aria-label="Menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
