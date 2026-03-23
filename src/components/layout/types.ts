export interface NavLink {
  href: string;
  label: string;
}

export interface NavDropdown {
  label: string;
  items: NavLink[];
}

export type NavItem = NavLink | NavDropdown;

export function isNavDropdown(item: NavItem): item is NavDropdown {
  return "items" in item;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Blockchain",
    items: [
      { href: "/transactions", label: "Transactions" },
      { href: "/blocks", label: "Blocks" },
    ],
  },
  { href: "/validators", label: "Validators" },
  { href: "/analytics", label: "Analytics" },
  {
    label: "Developers",
    items: [
      { href: "/developers", label: "Overview" },
      { href: "/developers/api", label: "API Docs" },
      { href: "/developers/guides", label: "Guides" },
    ],
  },
] as const;

// Keep for backward compatibility
export const NAV_LINKS: NavLink[] = [
  { href: "/transactions", label: "Transactions" },
  { href: "/validators", label: "Validators" },
  { href: "/blocks", label: "Blocks" },
] as const;
