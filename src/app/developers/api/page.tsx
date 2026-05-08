"use client";

import { useState, useEffect, useRef } from "react";
import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { AlertCircle, Menu, ChevronRight } from "lucide-react";
import { cn } from "@/utils/styling";
import { useOpenApiSpec } from "@/hooks/developers/useOpenApiSpec";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { EndpointGroup } from "@/types/openapi";
import EndpointCard from "../components/EndpointCard";

const SIDEBAR_METHOD_COLORS: Record<string, string> = {
  GET: "text-blue-600 bg-blue-500/10",
  POST: "text-green-600 bg-green-500/10",
  PUT: "text-yellow-600 bg-yellow-500/10",
  DELETE: "text-red-600 bg-red-500/10",
};

/** Shared sidebar nav items with collapsible endpoint groups */
function SidebarNavItems({
  groups,
  activeTag,
  activeEndpointId,
  onTagClick,
  onEndpointClick,
}: {
  groups: EndpointGroup[];
  activeTag: string;
  activeEndpointId: string;
  onTagClick: (tag: string) => void;
  onEndpointClick: (endpointId: string) => void;
}) {
  return (
    <div className="p-3 space-y-0.5">
      {groups.map((group) => {
        const isActive = activeTag === group.tag;
        return (
          <div key={group.tag}>
            {/* Tag header */}
            <button
              onClick={() => onTagClick(group.tag)}
              className={cn(
                "w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-300",
                "hover:bg-muted/50 cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform duration-300",
                  isActive && "rotate-90"
                )}
              />
              <span className="truncate flex-1 text-left">{group.tag}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {group.endpoints.length}
              </span>
            </button>

            {/* Collapsible endpoint list */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isActive
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="ml-3 border-l border-border/40 pl-1 py-0.5 space-y-px">
                {group.endpoints.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => onEndpointClick(ep.id)}
                    title={ep.summary || ep.path}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      "hover:bg-muted/50 cursor-pointer",
                      activeEndpointId === ep.id
                        ? "bg-primary/5 text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 px-1.5 py-0.5 rounded text-xs font-mono font-semibold leading-tight",
                        SIDEBAR_METHOD_COLORS[ep.method] ?? "text-gray-600 bg-gray-500/10"
                      )}
                    >
                      {ep.method}
                    </span>
                    <span className="truncate">
                      {ep.summary || ep.path}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Sidebar for API endpoint categories */
function ApiSidebar({
  groups,
  activeTag,
  activeEndpointId,
  onTagClick,
  onEndpointClick,
  isMobileOpen,
  onMobileToggle,
}: {
  groups: EndpointGroup[];
  activeTag: string;
  activeEndpointId: string;
  onTagClick: (tag: string) => void;
  onEndpointClick: (endpointId: string) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}) {
  const handleTagClick = (tag: string) => {
    onTagClick(tag);
    if (isMobileOpen) onMobileToggle();
  };

  const handleEndpointClick = (endpointId: string) => {
    onEndpointClick(endpointId);
    if (isMobileOpen) onMobileToggle();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:block w-[260px] shrink-0 self-start sticky top-32 z-10",
          "bg-card backdrop-blur-sm border border-border/30 rounded-lg",
          "max-h-[calc(100vh-6rem)] overflow-hidden"
        )}
      >
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)]">
          <SidebarNavItems
            groups={groups}
            activeTag={activeTag}
            activeEndpointId={activeEndpointId}
            onTagClick={handleTagClick}
            onEndpointClick={handleEndpointClick}
          />
        </div>
      </aside>

      {/* Mobile sheet */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileToggle}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="pt-12 overflow-y-auto max-h-screen">
            <SidebarNavItems
              groups={groups}
              activeTag={activeTag}
              activeEndpointId={activeEndpointId}
              onTagClick={handleTagClick}
              onEndpointClick={handleEndpointClick}
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
  const [activeEndpointId, setActiveEndpointId] = useState<string>("");
  const [expandedEndpointId, setExpandedEndpointId] = useState<string>("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const hasInitialized = useRef(false);

  // Set initial active tag when data loads (once only)
  useEffect(() => {
    if (groups && groups.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      setActiveTag(groups[0].tag);
      if (groups[0].endpoints.length > 0) {
        setActiveEndpointId(groups[0].endpoints[0].id);
      }
    }
  }, [groups]);

  // Scroll spy: only tracks active endpoint (tag expand/collapse is user-controlled)
  useEffect(() => {
    if (!groups || isScrolling) return;

    const handleScroll = () => {
      for (const group of [...groups].reverse()) {
        for (let j = group.endpoints.length - 1; j >= 0; j--) {
          const epEl = document.getElementById(`endpoint-${group.endpoints[j].id}`);
          if (epEl) {
            const epRect = epEl.getBoundingClientRect();
            if (epRect.top <= 200) {
              setActiveEndpointId(group.endpoints[j].id);
              return;
            }
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [groups, isScrolling]);

  const handleTagClick = (tag: string) => {
    // Toggle: clicking the active tag collapses it, clicking another expands it
    setIsScrolling(true);
    setActiveTag((prev) => (prev === tag ? "" : tag));
    setTimeout(() => setIsScrolling(false), 400);
  };

  const handleEndpointClick = (endpointId: string) => {
    setIsScrolling(true);
    setActiveEndpointId(endpointId);
    setExpandedEndpointId(endpointId);

    const el = document.getElementById(`endpoint-${endpointId}`);
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
            <aside className="hidden lg:block w-[260px] shrink-0">
              <div className="bg-card border border-border/30 rounded-lg p-3 space-y-1">
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
              activeEndpointId={activeEndpointId}
              onTagClick={handleTagClick}
              onEndpointClick={handleEndpointClick}
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
                      <EndpointCard
                        key={endpoint.id}
                        endpoint={endpoint}
                        autoExpand={expandedEndpointId === endpoint.id}
                      />
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
