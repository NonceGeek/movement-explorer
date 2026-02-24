"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Branding } from "@movementlabsxyz/movement-design-system";

const socialLinks = [
  {
    title: "Twitter",
    url: "https://x.com/moveindustries",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    title: "GitHub",
    url: "https://github.com/movementlabsxyz/movement",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
];

const companyLinks = [
  { label: "Learn", href: "https://www.movementnetwork.xyz/learn" },
  { label: "Blog", href: "https://www.movementnetwork.xyz/blog" },
  // { label: "Careers", href: "https://jobs.ashbyhq.com/moveindustries" },
];

const resourceLinks = [
  { label: "Ecosystem", href: "https://movementnetwork.xyz/ecosystem" },
  { label: "Move Docs", href: "https://docs.movementnetwork.xyz/general" },
  {
    label: "Developer Portal",
    href: "https://developer.movementnetwork.xyz/",
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Logo and Description */}
          <div className="md:col-span-5 flex items-start gap-3">
            <Link href="/" className="shrink-0">
              <Branding
                theme="industries"
                variant="logomark"
                color="white"
                className="h-full w-auto max-h-24"
              />
            </Link>
            <div className="space-y-2">
              <Link href="/" className="block w-fit">
                <span className="text-2xl font-heading font-bold text-white">
                  MoveScan
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Explore the Movement Network with the most comprehensive
                blockchain explorer powered by Movement.
              </p>
            </div>
          </div>

          {/* Company */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                  >
                    {link.label}
                    <ExternalLink
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-foreground">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                  >
                    {link.label}
                    <ExternalLink
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-foreground">
              Community
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              {socialLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.title}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110"
                >
                  {link.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Move Industries. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link
              href="https://www.movementnetwork.xyz/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
