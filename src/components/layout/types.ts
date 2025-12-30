export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/transactions", label: "Transactions" },
  // { href: "/analytics", label: "Analytics" },
  { href: "/validators", label: "Validators" },
  { href: "/blocks", label: "Blocks" },
] as const;
