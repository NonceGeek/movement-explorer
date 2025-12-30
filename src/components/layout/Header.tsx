"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnector } from "@/components/wallet";
import NetworkSelect from "./NetworkSelect";
import NavMobile from "./NavMobile";
import ThemeToggle from "./ThemeToggle";
import { CubeIcon } from "@movementlabsxyz/movement-design-system";

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
      className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
        isActive
          ? "text-foreground bg-moveus-marigold-500/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-moveus-marigold-500 rounded-full" />
      )}
    </Link>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform hover:scale-105"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-moveus-marigold-500/20 blur-lg rounded-full group-hover:bg-moveus-marigold-500/30 transition-all" />
            <CubeIcon
              size={24}
              className="relative text-moveus-marigold-500"
              strokeWidth={2}
            />
          </div>
          <span className="text-xl font-heading font-bold bg-linear-to-r from-foreground to-foreground/80 bg-clip-text">
            Movement{" "}
            <span className="text-moveus-marigold-500 font-mono">Explorer</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          {/* <div className="hidden md:block">
            <ThemeToggle />
          </div> */}

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
