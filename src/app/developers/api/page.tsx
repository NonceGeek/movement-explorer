"use client";

import { useState, useEffect } from "react";
import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { AlertCircle, Menu } from "lucide-react";
import { cn } from "@/utils/styling";
import { useOpenApiSpec } from "@/hooks/developers/useOpenApiSpec";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { EndpointGroup } from "@/types/openapi";
import EndpointCard from "../components/EndpointCard";

/** Shared sidebar nav items */
function SidebarNavItems({
  groups,
  activeTag,
  onTagClick,
}: {
  groups: EndpointGroup[];
  activeTag: string;
  onTagClick: (tag: string) => void;
}) {
  return (
    <div className="p-3 space-y-0.5">
      {groups.map((group) => (
        <button
          key={group.tag}
          onClick={() => onTagClick(group.tag)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
            "hover:bg-muted/50 cursor-pointer",
            activeTag === group.tag
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground"
          )}
        >
          <span>{group.tag}</span>
          <span className="text-xs text-muted-foreground">
            {group.endpoints.length}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Sidebar for API endpoint categories */
function ApiSidebar({
  groups,
  activeTag,
  onTagClick,
  isMobileOpen,
  onMobileToggle,
}: {
  groups: EndpointGroup[];
  activeTag: string;
  onTagClick: (tag: string) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}) {
  const handleTagClick = (tag: string) => {
    onTagClick(tag);
    if (isMobileOpen) onMobileToggle();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:block w-[220px] shrink-0 self-start sticky top-32 z-10",
          "bg-card/80 backdrop-blur-sm border border-border/30 rounded-lg",
          "max-h-[calc(100vh-6rem)] overflow-hidden"
        )}
      >
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
          <SidebarNavItems
            groups={groups}
            activeTag={activeTag}
            onTagClick={handleTagClick}
          />
        </div>
      </aside>

      {/* Mobile sheet */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileToggle}>
        <SheetContent side="left" className="w-[260px] p-0">
          <div className="pt-12 overflow-y-auto max-h-screen">
            <SidebarNavItems
              groups={groups}
              activeTag={activeTag}
              onTagClick={handleTagClick}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function ApiDocsPage() {
  const { data: groups, isLoading, error } = useOpenApiSpec();
  const [activeTag, setActiveTag] = useState<string>("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Set initial active tag when data loads
  useEffect(() => {
    if (groups && groups.length > 0 && !activeTag) {
      setActiveTag(groups[0].tag);
    }
  }, [groups, activeTag]);

  // Scroll spy for active tag
  useEffect(() => {
    if (!groups || isScrolling) return;

    const handleScroll = () => {
      for (let i = groups.length - 1; i >= 0; i--) {
        const el = document.getElementById(`tag-${groups[i].tag}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveTag(groups[i].tag);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [groups, isScrolling]);

  const handleTagClick = (tag: string) => {
    setIsScrolling(true);
    setActiveTag(tag);

    const el = document.getElementById(`tag-${tag}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setTimeout(() => setIsScrolling(false), 800);
  };

  return (
    <>
      <PageNavigation />
      <PageContainer>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">API Documentation</h1>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">
            Interactive documentation for the Movement Node API. Test endpoints
            directly in your browser.
          </p>
        </div>

        {isLoading && (
          <div className="flex gap-6">
            {/* Sidebar skeleton */}
            <aside className="hidden lg:block w-[220px] shrink-0">
              <div className="bg-card/80 border border-border/30 rounded-lg p-3 space-y-1">
                {[75, 55, 90, 65, 80, 45, 70, 60].map((w, i) => (
                  <EnhancedSkeleton
                    key={i}
                    className="h-9"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            </aside>

            {/* Endpoint list skeleton */}
            <div className="flex-1 min-w-0 space-y-8">
              {Array.from({ length: 3 }).map((_, groupIdx) => (
                <div key={groupIdx} className="space-y-3">
                  <EnhancedSkeleton className="h-6 w-32" />
                  <EnhancedSkeleton shape="text" className="w-48" />
                  {Array.from({ length: 3 + groupIdx }).map((_, cardIdx) => (
                    <div
                      key={cardIdx}
                      className="rounded-lg border p-4 flex items-center gap-3"
                    >
                      <EnhancedSkeleton className="h-6 w-12" />
                      <EnhancedSkeleton shape="text" className="flex-1 max-w-[200px]" />
                      <EnhancedSkeleton shape="text" className="w-40 hidden sm:block" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/30">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>Failed to load API specification. Please try again.</span>
          </div>
        )}

        {groups && (
          <div className="flex gap-6">
            {/* Tag sidebar */}
            <ApiSidebar
              groups={groups}
              activeTag={activeTag}
              onTagClick={handleTagClick}
              isMobileOpen={isMobileSidebarOpen}
              onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />

            {/* Endpoint list */}
            <div className="flex-1 min-w-0 space-y-8">
              {groups.map((group) => (
                <section
                  key={group.tag}
                  id={`tag-${group.tag}`}
                  className="scroll-mt-32"
                >
                  <h2 className="text-xl font-semibold mb-1">{group.tag}</h2>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {group.description}
                    </p>
                  )}
                  <div className="space-y-3">
                    {group.endpoints.map((endpoint) => (
                      <EndpointCard key={endpoint.id} endpoint={endpoint} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}
