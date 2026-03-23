"use client";

import { useState } from "react";
import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Briefcase, Menu } from "lucide-react";
import DevelopersSidebar from "../components/DevelopersSidebar";
import { GUIDES, type Guide } from "./data";

const CATEGORY_META = {
  ai: { label: "AI Integration", icon: Bot },
  portfolio: { label: "Portfolio & DeFi", icon: Briefcase },
  "getting-started": { label: "Getting Started", icon: Bot },
};

function GuideContent({ guide, onBack }: { guide: Guide; onBack: () => void }) {
  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        All Guides
      </Button>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div
          dangerouslySetInnerHTML={{
            __html: simpleMarkdownToHtml(guide.content),
          }}
        />
      </div>
    </div>
  );
}

/** Minimal markdown to HTML for guide content */
function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-guild-green/30 pl-4 my-4 text-sm text-muted-foreground">$1</blockquote>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-guild-green hover:underline">$1</a>')
    .replace(/\n\n/g, "<br/><br/>");
}

export default function GuidesPage() {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Group guides by category
  const grouped = GUIDES.reduce(
    (acc, guide) => {
      if (!acc[guide.category]) acc[guide.category] = [];
      acc[guide.category].push(guide);
      return acc;
    },
    {} as Record<string, Guide[]>
  );

  return (
    <>
      <PageNavigation />
      <PageContainer>
        <div className="flex gap-6">
          <DevelopersSidebar
            activeSection="guides"
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

            {selectedGuide ? (
              <GuideContent
                guide={selectedGuide}
                onBack={() => setSelectedGuide(null)}
              />
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold">Guides</h1>
                  <p className="text-muted-foreground mt-2">
                    Learn how to integrate Movement APIs with AI tools,
                    portfolio managers, and your applications.
                  </p>
                </div>

                {Object.entries(grouped).map(([category, guides]) => {
                  const meta =
                    CATEGORY_META[category as keyof typeof CATEGORY_META];
                  return (
                    <div key={category} className="mb-8">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {meta && <meta.icon className="h-5 w-5 text-guild-green" />}
                        {meta?.label ?? category}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guides.map((guide) => (
                          <Card
                            key={guide.slug}
                            className="cursor-pointer hover:border-guild-green/30 transition-colors"
                            onClick={() => setSelectedGuide(guide)}
                          >
                            <CardContent className="p-5">
                              <h3 className="font-semibold mb-1">
                                {guide.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {guide.description}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
