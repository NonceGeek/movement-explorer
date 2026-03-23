"use client";

import { useState } from "react";
import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  FileText,
  Key,
  Bot,
  ArrowRight,
  Terminal,
  Menu,
} from "lucide-react";
import Link from "next/link";
import DevelopersSidebar from "./components/DevelopersSidebar";

const FEATURE_CARDS = [
  {
    title: "API Documentation",
    description:
      "Interactive documentation for all 27+ Movement Node API endpoints. Test requests directly in your browser.",
    icon: Code,
    href: "/developers/api",
    cta: "Browse Endpoints",
  },
  {
    title: "Code Examples",
    description:
      "Ready-to-use code snippets in cURL, JavaScript, Python, and Go for every endpoint.",
    icon: Terminal,
    href: "/developers/api",
    cta: "View Examples",
  },
  {
    title: "Guides",
    description:
      "Learn how to integrate Movement APIs with ChatGPT, Claude, portfolio managers, and DeFi tools.",
    icon: FileText,
    href: "/developers/guides",
    cta: "Read Guides",
  },
  {
    title: "API Keys",
    description:
      "Generate and manage API keys for rate-limited access to Movement APIs.",
    icon: Key,
    href: "/developers/api-keys",
    cta: "Coming Soon",
    disabled: true,
  },
  {
    title: "AI Assistant",
    description:
      "Ask questions about on-chain data in natural language. Powered by AI with direct blockchain access.",
    icon: Bot,
    href: "/developers/ai",
    cta: "Coming Soon",
    disabled: true,
  },
];

export default function DevelopersPage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <>
      <PageNavigation />
      <PageContainer>
        <div className="flex gap-6">
          <DevelopersSidebar
            activeSection="overview"
            isMobileOpen={isMobileSidebarOpen}
            onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          <div className="flex-1 min-w-0">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </div>

            {/* Hero */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Developer Portal</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Build on Movement. Access blockchain data, submit transactions,
                and integrate with your applications using the Movement Node
                API.
              </p>
            </div>

            {/* Quick Start */}
            <Card className="mb-8 border-guild-green/30 bg-guild-green/5">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-3">Quick Start</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started with a simple API call:
                </p>
                <div className="bg-background rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <span className="text-muted-foreground">$</span>{" "}
                  <span className="text-guild-green">curl</span>{" "}
                  https://mainnet.movementnetwork.xyz/v1/info
                </div>
              </CardContent>
            </Card>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURE_CARDS.map((card) => (
                <Card
                  key={card.title}
                  className={
                    card.disabled ? "opacity-60" : "hover:border-guild-green/30 transition-colors"
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-guild-green/10">
                        <card.icon className="h-5 w-5 text-guild-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{card.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {card.description}
                        </p>
                        {card.disabled ? (
                          <span className="text-xs text-muted-foreground">
                            {card.cta}
                          </span>
                        ) : (
                          <Link
                            href={card.href}
                            className="text-sm text-guild-green hover:underline inline-flex items-center gap-1"
                          >
                            {card.cta}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
