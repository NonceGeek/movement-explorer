"use client";

import { useState } from "react";
import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Briefcase, Menu, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "@/components/ui/CodeBlock";
import DevelopersSidebar from "../components/DevelopersSidebar";
import { GUIDES, type Guide } from "./data";

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      title="Copy code"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

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
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-8 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-6 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-muted-foreground mb-3 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 my-2 text-sm text-muted-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 my-2 text-sm text-muted-foreground">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 my-4 text-sm text-muted-foreground">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {children}
            </a>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className ?? "");
            const codeStr = String(children).replace(/\n$/, "");
            if (match) {
              return (
                <div className="my-4 relative group">
                  <CodeBlock code={codeStr} language={match[1]} maxHeight="400px" />
                  <CopyCodeButton code={codeStr} />
                </div>
              );
            }
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="text-left py-2 px-3 font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="py-2 px-3 text-muted-foreground border-b border-border/30">{children}</td>
          ),
        }}
      >
        {guide.content}
      </ReactMarkdown>
    </div>
  );
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
                        {meta && <meta.icon className="h-5 w-5 text-primary" />}
                        {meta?.label ?? category}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {guides.map((guide) => (
                          <Card
                            key={guide.slug}
                            className="cursor-pointer hover:border-primary/30 transition-colors"
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
